import sqlite3
from flask_restful import Resource
from flask import request, jsonify, make_response
import sqlite3
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
import random
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import timedelta
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from datetime import datetime

class RegisterResource(Resource):
    def post(self):
        # Parse the incoming JSON request
        data = request.get_json()
        if not data:
            return make_response(jsonify({'message': 'No input data provided'}), 400)

        # Extract and validate required fields
        name = data.get('name')
        last_name = data.get('last_name')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([name, last_name, username, email, password]):
            return make_response(jsonify({'message': 'Missing required fields'}), 400)

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Save the user in the database
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('''
                    INSERT INTO doctors (name, last_name, username, email, password)
                    VALUES (?, ?, ?, ?, ?)
                ''', (name, last_name, username, email, hashed_password))
                conn.commit()
                return make_response(jsonify({'message': 'Registration successful'}), 201)
            except sqlite3.IntegrityError:
                return make_response(jsonify({'message': 'Username or Email already exists'}), 400)
            except Exception as e:
                return make_response(jsonify({'message': str(e)}), 500)
            


class LoginResource(Resource):
    def post(self):
        # Parse the incoming JSON request
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        # Try logging the user in
        result = login_user(data)

        if result:
            doctor_id = get_user_id(username)

            # Generate an access token for the logged-in user
            access_token = create_access_token(
                identity={"username": username, "id": doctor_id},
            )

            # Return the access token in the response
            return make_response(jsonify({'access_token': access_token, 'message': 'Login successful!'}), 200)
        else:
            # Invalid login details
            return make_response(jsonify({'message': 'Invalid username or password'}), 401)


class Verify2FAResource(Resource):
    @jwt_required()  # This decorator validates the JWT token
    def post(self):
        # Retrieve the entered verification code from the request
        entered_code = request.json.get('verification_code')

        # Decode the temporary token and get the user identity data
        decoded_token = get_jwt_identity()
        doctor_username = decoded_token.get("username")
        verification_code_hash = decoded_token.get("verification_code_hash")

        # Check the entered code against the hash

        if not isinstance(entered_code, str):
            raise TypeError("Invalid Type of Code")

        if check_password_hash(verification_code_hash, entered_code):
            doctor_id = get_user_id(doctor_username)
            # If successful, generate a new access token
            access_token = create_access_token(identity={"username": doctor_username, "id": doctor_id})

            return make_response(jsonify({'access_token': access_token, 'message': '2FA successful!'}), 200)
        else:
            # If the code is incorrect, return an error
            return make_response(jsonify({'message': 'Invalid verification code'}), 401)
        

class AddPatientResource(Resource):
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return make_response(jsonify({'message': 'No input data provided'}), 400)

            first_name = data.get('first_name')
            last_name = data.get('last_name')
            date_of_birth = data.get('date_of_birth')
            gender = data.get('gender')
            email = data.get('email')
            contact = data.get('contact')
            address = data.get('address')
            medical_history = data.get('medical_history')
            current_medication = data.get('current_medication')
            condition = data.get('condition')
            doctor_id = data.get('doctor_id')

            if not all([first_name, last_name, date_of_birth, gender, email, contact, address, doctor_id]):
                return make_response(jsonify({'message': 'Missing required fields'}), 400)

            # Save the patient in the database
            with sqlite3.connect('database.db') as conn:
                cursor = conn.cursor()
                try:
                    cursor.execute('''
                        INSERT INTO patients 
                        (first_name, last_name, date_of_birth, gender, email, contact, address, medical_history, current_medication, condition, doctor_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (first_name, last_name, date_of_birth, gender, email, contact, address, medical_history, current_medication, condition, doctor_id))
                    conn.commit()
                    return make_response(jsonify({'message': 'Patient added successfully'}), 201)
                except sqlite3.IntegrityError:
                    return make_response(jsonify({'message': 'Email already exists'}), 400)
                except Exception as e:
                    return make_response(jsonify({'message': str(e)}), 500)
        except Exception as e:
            return make_response(jsonify({'message': 'Error Adding Patient.', 'error': str(e)}), 401)


class GetPatientsResource(Resource):
    def get(self):
        try:
            # Get the doctor ID from the query parameters
            doctor_id = request.args.get('doctor_id')
            if not doctor_id:
                return {'message': 'Doctor ID is not set.'}, 400

            with sqlite3.connect('database.db') as conn:
                conn.row_factory = sqlite3.Row  # To return rows as dictionaries
                cursor = conn.cursor()

                query = '''
                    SELECT id, first_name, last_name, date_of_birth, gender, email, contact, address, 
                           medical_history, current_medication, condition
                    FROM patients 
                    WHERE doctor_id = ?
                '''
                cursor.execute(query, (doctor_id,))
                rows = cursor.fetchall()

                patients = [dict(row) for row in rows]
                return {'patients': patients}, 200
        except Exception as e:
            return {'message': str(e)}, 500
        


class GetDailyData(Resource):
    def get(self, patient_id):
        conn = get_db_connection()

        # Query to get the latest date for the patient
        latest_day_query = '''
            SELECT MAX(day_interval) as latest_day
            FROM daily_data
            WHERE id = ?
        '''
        latest_day_row = conn.execute(latest_day_query, (patient_id,)).fetchone()

        if latest_day_row is None or latest_day_row['latest_day'] is None:
            return jsonify({'message': 'No data found for this patient.'}), 404

        latest_day = latest_day_row['latest_day']

        # Query to get the saturation data for the latest day
        data_query = '''
            SELECT day_interval, avg_spo2
            FROM daily_data
            WHERE id = ? AND day_interval LIKE ?
        '''
        data = conn.execute(data_query, (patient_id, f'{latest_day[:10]}%')).fetchall()

        # Initialize the chart data with 0s for each of the 24 hours
        chart_data = [0] * 24  # Fill with 0 instead of None

        for row in data:
            hour = int(row['day_interval'][11:13])
            avg_spo2 = row['avg_spo2'] if row['avg_spo2'] is not None else 0  # Ensure missing values are 0
            chart_data[hour] = avg_spo2

        conn.close()

        return jsonify({
            'latest_day': latest_day[:10],
            'data': chart_data
        })
        


class GetMonthlyData(Resource):
    def get(self, patient_id):
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()

        # Get the month and year from query parameters
        try:
            month = int(request.args.get('month'))
            year = int(request.args.get('year'))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid month or year"}), 400

        # Calculate the number of days in the selected month
        try:
            start_date = datetime(year, month, 1)
            num_days = (datetime(year, month % 12 + 1, 1) - timedelta(days=1)).day
        except ValueError:
            return jsonify({"error": "Invalid month or year"}), 400

        # Prepare a dictionary for all days in the month
        all_days = {
            start_date.replace(day=day).strftime('%Y-%m-%d'): {
                "day_of_the_month": start_date.replace(day=day).strftime('%Y-%m-%d'),
                "total_measurements": 0,
                "total_measurements_above_88": 0,
                "total_hours_used": 0,
            } for day in range(1, num_days + 1)
        }

        # Fetch data from the database for the specified month and year
        cursor.execute("""
            SELECT total_measurements, day_of_the_month, total_measurements_above_88, total_hours_used 
            FROM monthly_data 
            WHERE id = ? 
              AND strftime('%m', day_of_the_month) = ? 
              AND strftime('%Y', day_of_the_month) = ?
        """, (patient_id, f"{month:02}", str(year)))
        rows = cursor.fetchall()

        low_measurement_days = []
        zero_measurement_days = []

        # Fill the all_days dictionary with fetched data
        for row in rows:
            total_measurements, day_of_the_month, total_measurements_above_88, total_hours_used = row
            if day_of_the_month in all_days:
                all_days[day_of_the_month] = {
                    "day_of_the_month": day_of_the_month,
                    "total_measurements": total_measurements,
                    "total_measurements_above_88": total_measurements_above_88,
                    "total_hours_used": total_hours_used,
                }

                # Track days with total_measurements < 1000 or total_measurements == 0
                if total_measurements < 1200:
                    low_measurement_days.append(day_of_the_month)
                if total_measurements == 0:
                    zero_measurement_days.append(day_of_the_month)

        # Check for missing days (those not in the database)
        for day in all_days:
            if all_days[day]["total_measurements"] == 0:
                zero_measurement_days.append(day)

        conn.close()

        # Return data and low measurement days
        return jsonify({
            "data": list(all_days.values()),
            "low_measurement_days": low_measurement_days,
            "zero_measurement_days": zero_measurement_days
        })






def send_verification_email(recipient_email, code):
    """Send an email with the verification code to the user."""
    sender_email = "incmprojectmanagement@gmail.com"
    sender_password = "xbac yuwh grdy uuto"
    
    subject = "Your Login Verification Code"
    body = f"Your login verification code is: {code}. This code will expire in 5 minutes."
    
    # Create the email message
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    # Set up the SMTP server
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        print(f"Logged in to SMTP server as {sender_email}")
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        print(f"Verification email sent to {recipient_email}")
    except Exception as e:
        print("Error sending email:", e)


def login_user(data):
    if not data:
        return {'message': 'No input data provided'}, 400

    # Extract username and password
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return {'message': 'Missing required fields'}, 400

    # Validate the user's credentials
    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT password FROM doctors WHERE username = ?', (username,))
            user = cursor.fetchone()

            if not user:
                return {'message': 'Invalid username or password'}, 401

            # Check the password hash
            stored_password_hash = user[0]
            if not check_password_hash(stored_password_hash, password):
                return {'message': 'Invalid username or password'}, 401

    except sqlite3.Error as e:
        return {'message': f'Database error: {str(e)}'}, 500

    return True

def get_user_email(username):
    if not username:
        return {'message': 'No username provided'}, 400

    # Query the database for the user's email
    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT email FROM doctors WHERE username = ?', (username,))
            user = cursor.fetchone()

            if not user:
                return {'message': 'Username not found'}, 404

            # Return the email address as a string
            return user[0]

    except sqlite3.Error as e:
        return {'message': f'Database error: {str(e)}'}, 500
    
def get_user_id(username):
    if not username:
        return {'message': 'No username provided'}, 400

    # Query the database for the user's ID
    try:
        with sqlite3.connect('database.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM doctors WHERE username = ?', (username,))
            user = cursor.fetchone()

            if not user:
                return {'message': 'Username not found'}, 404

            # Return the user ID as a string or integer
            return user[0]

    except sqlite3.Error as e:
        return {'message': f'Database error: {str(e)}'}, 500
    
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


            
            


