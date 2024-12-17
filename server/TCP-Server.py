import http.server
import socketserver
import json

class SensorDataHandler(http.server.BaseHTTPRequestHandler):
    data_store = []

    def set_cors_headers(self):
        """Helper method to set the CORS headers."""
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow requests from any origin
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')  # Allow GET, POST, OPTIONS methods
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')  # Allow the Content-Type header

    def do_OPTIONS(self):
        """Handle OPTIONS method for preflight requests."""
        self.send_response(200)
        self.set_cors_headers()  # Set CORS headers for preflight
        self.end_headers()

    def do_POST(self):
        # Log the request path
        print(f"Received POST request on {self.path}")
        
        # Set CORS headers
        self.set_cors_headers()

        # Read the content length
        content_length = int(self.headers['Content-Length'])
        
        # Read the body of the request
        post_data = self.rfile.read(content_length)
        
        # Parse the JSON payload
        try:
            data = json.loads(post_data)
            bpm = data.get("BPM")
            spo2 = data.get("SpO2")
            
            if bpm is not None and spo2 is not None:
                print(f"Received Data - BPM: {bpm}, SpO2: {spo2}")
                self.data_store.append(data)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Data received successfully")
            else:
                print("Missing BPM or SpO2 in the payload")
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Missing BPM or SpO2 in the payload")
        except json.JSONDecodeError:
            print("Invalid JSON payload")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON payload")
        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b"Internal server error")

    def do_GET(self):
        # Log the request path
        print(f"Received GET request on {self.path}")
        
        # Set CORS headers
        self.set_cors_headers()

        if self.path == '/sensor-data':
            # Return the stored data as JSON
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(self.data_store).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

    def log_message(self, format, *args):
        return  # Suppress default logging to keep output clean

# Set up the server
PORT = 5001
Handler = SensorDataHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
