import sqlite3
import json
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Function to send email
def send_saturation_email(recipient_email, first_name, last_name, is_doctor=False, is_enough=True):
    """Send an email to the user or doctor regarding low saturation levels."""
    sender_email = "incmprojectmanagement@gmail.com"
    sender_password = "xbac yuwh grdy uuto"
    
    subject = "Your Saturation"
    
    # Adjust email body content based on conditions
    if is_doctor:
        if is_enough:
            body = f"The saturation of your patient {first_name} {last_name} is below 88% on average with above 15 hours usage per day. Please review."
        else:
            body = f"The oxygen and sensor use of your patient {first_name} {last_name} is probably below 15 hours. Please review."
    else:
        if is_enough:
            body = f"Saturation for {first_name} {last_name} is below 88% on average with above 15 hours usage per day. Pay attention to oxygen usage."
        else:
            body = f"The oxygen and sensor use for {first_name} {last_name} is probably below 15 hours. Pay attention to oxygen usage."

    # Prepare and send email
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        print(f"Email sent to {recipient_email}")
    except Exception as e:
        print(f"Error sending email to {recipient_email}: {e}")


# Function to get doctor's email
def get_doctor_email(doctor_id):
    """Retrieve the doctor's email address based on the doctor's ID."""
    if not doctor_id:
        return None

    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT email FROM doctors WHERE id = ?', (doctor_id,))
            doctor = cursor.fetchone()
            return doctor[0] if doctor else None
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None

def process_patients():
    """Process patient data and send emails based on monthly_data table."""
    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM patients')
            patients = cursor.fetchall()

            for patient in patients:
                id, first_name, last_name, _, _, email, _, _, _, _, _, doctor_id = patient
                test_date = datetime.now()
                current_day = test_date.date()
                print(test_date)
                is_enough = True  # Assuming we will set this to True unless proven otherwise
                
                # Fetch monthly data for the current date
                cursor.execute("""
                    SELECT * FROM monthly_data 
                    WHERE id = ? AND day_of_the_month = ?""", (id, current_day))
                monthly_data = cursor.fetchone()

                if not monthly_data:
                    # No data found for the current day
                    print(f"No data for patient {first_name} {last_name} on day {current_day}. Sending email with is_enough = False.")
                    send_saturation_email(email, first_name, last_name, is_doctor=False, is_enough=False)
                    
                    # Send email to doctor
                    doctor_email = get_doctor_email(doctor_id)
                    if doctor_email:
                        send_saturation_email(doctor_email, first_name, last_name, is_doctor=True, is_enough=False)
                    continue  # Skip further checks for this patient

                # Retrieve values from the monthly_data table
                total_measurement = monthly_data[0]  # Assuming total_measurement is in 3rd column
                total_measurements_above_88 = monthly_data[2]  # Assuming total_measurements_above_88 is in 4th column

                # Check if total_measurement is above 1200
                if total_measurement < 1200:
                    print(f"Patient {first_name} {last_name} has a total_measurement below 1200. Sending email with is_enough = False.")
                    send_saturation_email(email, first_name, last_name, is_doctor=False, is_enough=False)
                    
                    # Send email to doctor
                    doctor_email = get_doctor_email(doctor_id)
                    if doctor_email:
                        send_saturation_email(doctor_email, first_name, last_name, is_doctor=True, is_enough=False)
                else:
                    # If total_measurement is above 1200, check total_measurements_above_88
                    if total_measurements_above_88 < 900:
                        print(f"Patient {first_name} {last_name} has total_measurements_above_88 below 900. Sending email with is_enough = True.")
                        send_saturation_email(email, first_name, last_name, is_doctor=False, is_enough=True)
                        
                        # Send email to doctor
                        doctor_email = get_doctor_email(doctor_id)
                        if doctor_email:
                            send_saturation_email(doctor_email, first_name, last_name, is_doctor=True, is_enough=True)
                    else:
                        # No email needs to be sent if the total_measurements_above_88 is above 900
                        print(f"Patient {first_name} {last_name} has total_measurements_above_88 above 900. No email sent.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")

# Run the function
if __name__ == "__main__":
    process_patients()