from flask import Flask
import sqlite3
from flask_restful import Api
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # Import JWTManager
from resources import RegisterResource, LoginResource, Verify2FAResource, AddPatientResource, GetPatientsResource
from monitor_database import process_patients  # Import the process_patients function
from server.tcp_server import run_tcp_server
from apscheduler.schedulers.background import BackgroundScheduler  # Importing the scheduler
from apscheduler.triggers.cron import CronTrigger  # Importing cron trigger
import threading

app = Flask(__name__)
CORS(app)  
api = Api(app)

# Initialize JWTManager
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Set a secret key for JWT
jwt = JWTManager(app)

def init_db():
    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
        
        # Create the doctors table if not exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS doctors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        ''')

        # Create the patients table if not exists with data as JSON
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT,
                last_name TEXT,
                date_of_birth TEXT,
                gender TEXT,
                email TEXT UNIQUE,
                contact TEXT,
                address TEXT,
                medical_history TEXT,
                current_medication TEXT,
                condition TEXT,
                doctor_id TEXT,
                data TEXT  
            )
        ''')

# Initialize the database
init_db()

# Default route
@app.route('/')
def hello_world():
    return 'Hello, World!'

# API routes
api.add_resource(RegisterResource, '/register')
api.add_resource(LoginResource, '/login')
api.add_resource(Verify2FAResource, '/verify-2fa')
api.add_resource(AddPatientResource, '/add-patient')
api.add_resource(GetPatientsResource, '/get-patients')

def run_flask():
    app.run(host='0.0.0.0', port=5000)

def run_scheduled_task():
    print("Scheduled task is running...")
    process_patients()  


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_scheduled_task, CronTrigger(hour=17, minute=25))
    scheduler.start()

if __name__ == '__main__':
    # Start the scheduler
    start_scheduler()

    # Start Flask app in a separate thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Start TCP server in a separate thread
    tcp_thread = threading.Thread(target=run_tcp_server, daemon=True)
    tcp_thread.start()

    # Allow both servers and the scheduler to run concurrently
    flask_thread.join()  # Block the main thread, ensuring both servers keep running
    tcp_thread.join()  # Block the main thread, ensuring both servers keep running
