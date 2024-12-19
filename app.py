from flask import Flask
import sqlite3
from flask_restful import Api
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # Import JWTManager
from resources import RegisterResource, LoginResource, Verify2FAResource

app = Flask(__name__)
CORS(app)  
api = Api(app)

# Initialize JWTManager
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Set a secret key for JWT
jwt = JWTManager(app)

def init_db():
    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()
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
        conn.commit()

# Initialize the database
init_db()

# Default route
@app.route('/')
def hello_world():
    return 'Hello, World!'

# API routes
api.add_resource(RegisterResource, '/register')  # Register route
api.add_resource(LoginResource, '/login')
api.add_resource(Verify2FAResource, '/verify-2fa')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
