# TO BE TESTED I DONT KNOW IF IT WORKS

import http.server
import socketserver
import json
import sqlite3
from datetime import datetime

class SensorDataHandler(http.server.BaseHTTPRequestHandler):
    database_name = "database.db"

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        print(f"Received POST request on {self.path}")

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data)
            bpm = data.get("BPM")
            spo2 = data.get("SpO2")
            patient_id = data.get("id")

            if bpm is not None and spo2 is not None and patient_id is not None:
                print(f"Received Data - BPM: {bpm}, SpO2: {spo2}, ID: {patient_id}")

                # Save to database
                try:
                    if self.append_to_existing_patient(patient_id, bpm, spo2):
                        self.send_response(200)
                        self.send_cors_headers()
                        self.end_headers()
                        self.wfile.write(b"Data received and appended successfully")
                except ValueError as ve:
                    self.send_response(400)
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(str(ve).encode())
            else:
                print("Missing BPM, SpO2, or ID in the payload")
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b"Missing BPM, SpO2, or ID in the payload")
        except json.JSONDecodeError:
            print("Invalid JSON payload")
            self.send_response(400)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b"Invalid JSON payload")
        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b"Internal server error")

    def do_GET(self):
        print(f"Received GET request on {self.path}")

        if self.path == '/sensor-data':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            try:
                # Retrieve all data from the database
                data = self.get_all_data()
                
                # Convert the data into FHIR-compliant observations
                fhir_data = self.generate_fhir_observations(data)
                
                # Send the FHIR-compliant data as the response
                self.wfile.write(json.dumps(fhir_data, indent=2).encode())
            except Exception as e:
                print(f"Error processing FHIR data: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Error processing FHIR data")
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b"Not Found")

    def append_to_existing_patient(self, patient_id, bpm, spo2):
        try:
            patient_id = int(patient_id)  # Ensure patient_id is an integer

            connection = sqlite3.connect(self.database_name)
            cursor = connection.cursor()

            # Get the current timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Retrieve existing data for the patient
            cursor.execute('SELECT id FROM patients WHERE id = ?', (patient_id,))
            validate = cursor.fetchone()

            print(f"Query result for patient ID {patient_id}: {validate}")  # Debug print

            if validate is None:
                raise ValueError("Patient ID not found")
            
            cursor.execute('SELECT data FROM patients WHERE id = ?', (patient_id,))
            result = cursor.fetchone()

            existing_data = json.loads(result[0]) if result[0] else []

            # Ensure existing_data is a list
            if not isinstance(existing_data, list):
                existing_data = []

            # Append new data
            existing_data.append({"BPM": bpm, "SpO2": spo2, "id": patient_id, "time": timestamp})

            updated_data = json.dumps(existing_data)
            cursor.execute('UPDATE patients SET data = ? WHERE id = ?', (updated_data, patient_id))
            connection.commit()
            connection.close()
            return True

        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return False
        except ValueError as ve:
            print(f"Value error: {ve}")
            raise
        except Exception as ex:
            print(f"Unexpected error: {ex}")
    def get_all_data(self):
        connection = sqlite3.connect(self.database_name)
        cursor = connection.cursor()

        # Modify the query to select only the 'id' and 'data' columns
        cursor.execute('SELECT id, data FROM patients')
        rows = cursor.fetchall()
        connection.close()

        data = []
        for row in rows:
            patient_id = row[0]  # First column (id)
            patient_data = row[1]  # Second column (data)

            # Check if the 'data' is None or empty and handle accordingly
            if patient_data is None:
                patient_data = []  # Default to empty list if no data exists
            else:
                try:
                    patient_data = json.loads(patient_data)  # Try to parse the JSON data
                except json.JSONDecodeError:
                    print(f"Invalid JSON in data for patient {patient_id}, using empty list")
                    patient_data = []  # Use empty list if JSON decoding fails

            data.append({"id": patient_id, "data": patient_data})
        
        return data

    def generate_fhir_observations(self, database_data):
        spo2_template = {
            "resourceType": "Observation",
            "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/vitalsigns"]},
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs"
                }],
                "text": "Vital Signs"
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "59408-5",
                    "display": "Oxygen saturation in Arterial blood by Pulse oximetry"
                }]
            },
        }

        bpm_template = {
            "resourceType": "Observation",
            "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/vitalsigns"]},
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "vital-signs",
                    "display": "Vital Signs"
                }],
                "text": "Vital Signs"
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "8867-4",
                    "display": "Heart rate"
                }]
            },
        }

        fhir_observations = []

        for patient in database_data:
            patient_id = patient["id"]
            observations = patient["data"]

            for observation in observations:
                # Generate FHIR-compliant SpO2 observation
                spo2_observation = spo2_template.copy()
                spo2_observation.update({
                    "id": f"spo2-{patient_id}-{observation['time']}",
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "effectiveDateTime": observation["time"],
                    "valueQuantity": {
                        "value": observation["SpO2"],
                        "unit": "%",
                        "system": "http://unitsofmeasure.org",
                        "code": "%"
                    }
                })

                # Generate FHIR-compliant BPM observation
                bpm_observation = bpm_template.copy()
                bpm_observation.update({
                    "id": f"bpm-{patient_id}-{observation['time']}",
                    "subject": {"reference": f"Patient/{patient_id}"},
                    "effectiveDateTime": observation["time"],
                    "valueQuantity": {
                        "value": observation["BPM"],
                        "unit": "beats/minute",
                        "system": "http://unitsofmeasure.org",
                        "code": "/min"
                    }
                })

                # Add observations to the list
                fhir_observations.append(spo2_observation)
                fhir_observations.append(bpm_observation)

        return fhir_observations




    def log_message(self, format, *args):
        return  # Suppress default logging to keep output clean
    
def run_tcp_server():
    PORT = 8002
    Handler = SensorDataHandler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving on port {PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    run_tcp_server()