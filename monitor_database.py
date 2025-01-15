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

# Function to process patient data
def process_patients():
    """Process patient data and send emails if average SpO2 is below 88%."""
    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM patients')
            patients = cursor.fetchall()

            for patient in patients:
                id, first_name, last_name, _, _, email, _, _, _, _, _, doctor_id, data = patient

                if not data:
                    print(f"No data available for patient {first_name} {last_name}. Skipping...")
                    continue

                try:
                    # Parse SpO2 data
                    readings = json.loads(data)
                    now = datetime.now()
                    last_24_hours = [
                        r for r in readings
                        if datetime.strptime(r['time'], '%Y-%m-%d %H:%M:%S') > now - timedelta(days=1)
                    ]

                    if not last_24_hours:
                        print(f"No data for the last 24 hours for patient {first_name} {last_name}")
                        continue

                    # Check if there are fewer than 10,800 readings (less than 15 hours)
                    if len(last_24_hours) < 6750:
                        # Oxygen usage is probably not enough, so set is_enough to False
                        is_enough = False
                        # Send email about low oxygen usage to both patient and doctor
                        send_saturation_email(email, first_name, last_name, is_doctor=False, is_enough=is_enough)

                        # Send email to doctor
                        doctor_email = get_doctor_email(doctor_id)
                        if doctor_email:
                            send_saturation_email(doctor_email, first_name, last_name, is_doctor=True, is_enough=is_enough)
                    else:
                        # If there are enough readings, calculate the average SpO2
                        avg_spo2 = sum(r['SpO2'] for r in last_24_hours) / len(last_24_hours)
                        print(f"Patient {first_name} {last_name} has an average SpO2 of {avg_spo2:.2f}%")

                        # Set is_enough to True and check if the average SpO2 is below 88%
                        is_enough = True
                        if avg_spo2 < 88:
                            # Send email to patient
                            send_saturation_email(email, first_name, last_name, is_doctor=False, is_enough=is_enough)

                            # Send email to doctor
                            doctor_email = get_doctor_email(doctor_id)
                            if doctor_email:
                                send_saturation_email(doctor_email, first_name, last_name, is_doctor=True, is_enough=is_enough)

                except (ValueError, KeyError, json.JSONDecodeError) as e:
                    print(f"Error processing data for patient {first_name} {last_name}: {e}")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
# Run the function
if __name__ == "__main__":
    process_patients()