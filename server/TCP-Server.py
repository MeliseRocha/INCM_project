import http.server
import socketserver
import json

class SensorDataHandler(http.server.BaseHTTPRequestHandler):
    data_store = []

    def send_cors_headers(self):
        # Allow cross-origin requests from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        # Handle POST request
        print(f"Received POST request on {self.path}")
        
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            bpm = data.get("BPM")
            spo2 = data.get("SpO2")
            
            if bpm is not None and spo2 is not None:
                print(f"Received Data - BPM: {bpm}, SpO2: {spo2}")
                self.data_store.append(data)
                self.send_response(200)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b"Data received successfully")
            else:
                print("Missing BPM or SpO2 in the payload")
                self.send_response(400)
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(b"Missing BPM or SpO2 in the payload")
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
            self.wfile.write(json.dumps(self.data_store).encode())
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b"Not Found")

    def log_message(self, format, *args):
        return  # Suppress default logging to keep output clean

PORT = 5001
Handler = SensorDataHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
