# TO BE TESTED I DONT KNOW IF IT WORKS

import http.server
import socketserver
import json
import sqlite3
from datetime import datetime
from urllib.parse import urlparse, parse_qs

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
            sensor_time_stamp = data.get("sensor_time_stamp")

            # Check if all necessary data is present
            if bpm and spo2 and patient_id:
                # Save to database
                try:
                    if self.append_to_existing_patient(patient_id, bpm, spo2, sensor_time_stamp):
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

        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        requested_id = query_params.get('id', [None])[0]

        if path == '/sensor-data':
            self.send_response(200 if requested_id else 400)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            if not requested_id:
                self.wfile.write(b'{"error": "Missing or invalid \'id\' query parameter"}')
                return

            try:
                data = self.get_data_by_id(requested_id)
                if not data[0]["data"]:
                    self.wfile.write(json.dumps(None).encode())
                else:
                    fhir_data = self.generate_fhir_observations(data)
                    self.wfile.write(json.dumps(fhir_data, indent=2).encode())
            except Exception as e:
                print(f"Error processing FHIR data: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'{"error": "Error processing FHIR data"}')
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def append_to_existing_patient(self, patient_id, bpm, spo2, sensor_time_stamp):
        try:
            patient_id = int(patient_id)  # Ensure patient_id is an integer

            connection = sqlite3.connect(self.database_name)
            cursor = connection.cursor()

            # Check if the patient_id exists in the patients table
            cursor.execute('''
                SELECT COUNT(*) FROM patients WHERE id = ?
            ''', (patient_id,))
            patient_exists = cursor.fetchone()[0]

            if patient_exists == 0:
                # If the patient doesn't exist, raise an error or return False
                print(f"Patient with ID {patient_id} does not exist.")
                connection.close()
                return False

            # Get the current timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Insert new measurement data into the measurements table
            cursor.execute('''
                INSERT INTO measurements (spo2, bpm, timestamp, timestamp_esp32, id)
                VALUES (?, ?, ?, ?, ?)
            ''', (spo2, bpm, timestamp, sensor_time_stamp, patient_id))

            connection.commit()
            connection.close()
            return True
        except sqlite3.Error as e:
            print(f"Database error occurred: {e}")
            return False
        except Exception as e:
            print(f"An error occurred: {e}")
            return False

        
    def get_data_by_id(self, requested_id):
        try:
            connection = sqlite3.connect(self.database_name)
            cursor = connection.cursor()
            cursor.execute('''
                SELECT spo2, bpm, timestamp
                FROM measurements
                WHERE id = ?
            ''', (requested_id,))
            rows = cursor.fetchall()
            connection.close()

            if not rows:
                return [{"id": requested_id, "data": []}]

            observations = [
                {"SpO2": row[0], "BPM": row[1], "time": row[2]}
                for row in rows
            ]
            return [{"id": requested_id, "data": observations}]
        except Exception as e:
            print(f"Database error: {e}")
            return [{"id": requested_id, "data": []}]

    def generate_fhir_observations(self, database_data):
        from copy import deepcopy

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
                spo2_observation = deepcopy(spo2_template)
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

                bpm_observation = deepcopy(bpm_template)
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