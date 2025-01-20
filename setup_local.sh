#!/bin/bash

# Define the ports for the services (you can adjust as needed)
PORTS=(8002 3002 5000)

# Define the path where Routes.js will be saved
ROUTES_JS_PATH="frontend/src/components/Routes.js"

# Check if Routes.js already exists
if [ -f "$ROUTES_JS_PATH" ]; then
    echo "$ROUTES_JS_PATH exists. Updating the file..."
else
    echo "$ROUTES_JS_PATH does not exist. Creating the file..."
fi

# Start the Routes.js file creation or update
echo "export const Routes = {" > $ROUTES_JS_PATH

# Add the static localhost routes for each port
for PORT in "${PORTS[@]}"; do
    LOCAL_URL="http://localhost:${PORT}"
    echo "  port${PORT}: '${LOCAL_URL}'," >> $ROUTES_JS_PATH
done

# Close the object in Routes.js
echo "};" >> $ROUTES_JS_PATH

# Output the result for verification
echo "Routes.js file saved/updated at $ROUTES_JS_PATH with localhost URLs"

# Step 1: Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Step 2: Run Python app
echo "Starting Python app..."
python3 app.py &  # Run the app in the background

# Step 3: Go to the frontend directory and install react-scripts
echo "Navigating to frontend/ and installing react-scripts..."
cd frontend/
npm install react-scripts --save

# Step 4: Start the React development server
echo "Starting React development server..."
npm start
