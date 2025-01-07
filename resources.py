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

        result = login_user(data)

        if result:
            verification_code = str(random.randint(100000, 999999))
            verification_code_hash = generate_password_hash(verification_code)

            temporary_token = create_access_token(
                identity={
                    "username": username,
                    "verification_code_hash": verification_code_hash
                },
                expires_delta=timedelta(minutes=5)  # Token expires in 5 minutes
            )
            email = get_user_email(username)

            # Start a background thread to send the verification email
            email_thread = threading.Thread(target=send_verification_email, args=(email, verification_code))
            email_thread.start()

            print(f'Email sent to {email} with verification code: {verification_code}')

            return make_response(jsonify({'temporary_token': temporary_token, 'message': 'Verification code sent!'}), 200)
        else:
            return make_response(jsonify({'message': 'Invalid username or password'}), 401)


class Verify2FAResource(Resource):
    @jwt_required()  # This decorator validates the JWT token
    def post(self):
        # Retrieve the entered verification code from the request
        entered_code = request.json.get('verification_code')

        # Decode the temporary token and get the user identity data
        decoded_token = get_jwt_identity()
        global doctor_username
        doctor_username = decoded_token.get("username")
        verification_code_hash = decoded_token.get("verification_code_hash")

        # Check the entered code against the hash

        if not isinstance(entered_code, str):
            raise TypeError("Invalid Type of Code")

        if check_password_hash(verification_code_hash, entered_code):
            global doctor_id
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

            if not all([first_name, last_name, date_of_birth, gender, email, contact, address]):
                return make_response(jsonify({'message': 'Missing required fields'}), 400)

            # Save the patient in the database
            with sqlite3.connect('database.db') as conn:
                cursor = conn.cursor()
                try:
                    cursor.execute('''
                        INSERT INTO patients 
                        (first_name, last_name, date_of_birth, gender, email, contact, address, medical_history, current_medication, condition, doctor_id, data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
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
            
            if doctor_id is None:
                return {'message': 'Doctor ID is not set.'}, 400
            
            # Connect to the database
            with sqlite3.connect('database.db') as conn:
                conn.row_factory = sqlite3.Row  # To return rows as dictionaries
                cursor = conn.cursor()
                
                # Parameterized query to filter patients by doctor_id
                query = '''
                    SELECT id, first_name, last_name, date_of_birth, gender, email, contact, address, 
                           medical_history, current_medication, condition
                    FROM patients 
                    WHERE doctor_id = ?
                '''
                cursor.execute(query, (doctor_id,))
                rows = cursor.fetchall()

                # Convert rows to a list of dictionaries
                patients = [dict(row) for row in rows]

                # Debug: Print patients to the console
                print("Fetched Patients:", patients)

                return {'patients': patients}, 200
        except Exception as e:
            # Debug: Print the error to the console
            print("Error fetching patients:", str(e))
            return {'message': str(e)}, 500
        
 

            

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



            
            


