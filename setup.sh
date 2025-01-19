#!/bin/bash

# Check if the environment variables exist
if [ -z "$CODESPACE_NAME" ]; then
    echo "CODESPACE_NAME is not set. This script must be run inside a codespace."
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "GITHUB_REPOSITORY is not set. This script must be run inside a GitHub repository."
    exit 1
fi

# Extract repository name and codespace name
REPOSITORY_NAME=$(echo $GITHUB_REPOSITORY | cut -d '/' -f2)
CODESPACE_NAME=$CODESPACE_NAME

# Display the results
echo "Repository Name: $REPOSITORY_NAME"
echo "Codespace Name: $CODESPACE_NAME"

# Generate the URLs for the ports (you can change these ports as needed)
PORTS=(8002 3002 5000)

# Define the path where Routes.js will be saved
ROUTES_JS_PATH="frontend/src/components/Routes.js"

# Prepare the Routes.js file with the dynamic URLs
echo "export const Routes = {" > $ROUTES_JS_PATH
for PORT in "${PORTS[@]}"; do
    DEPLOY_URL="https://${CODESPACE_NAME}-${PORT}.app.github.dev"
    echo "  port${PORT}: '${DEPLOY_URL}'," >> $ROUTES_JS_PATH
done
# Close the object in Routes.js#!/bin/bash

# Check if the environment variables exist
if [ -z "$CODESPACE_NAME" ]; then
    echo "CODESPACE_NAME is not set. This script must be run inside a codespace."
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "GITHUB_REPOSITORY is not set. This script must be run inside a GitHub repository."
    exit 1
fi

# Extract repository name and codespace name
REPOSITORY_NAME=$(echo $GITHUB_REPOSITORY | cut -d '/' -f2)
CODESPACE_NAME=$CODESPACE_NAME

# Display the results
echo "Repository Name: $REPOSITORY_NAME"
echo "Codespace Name: $CODESPACE_NAME"

# Generate the URLs for the ports (you can change these ports as needed)
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

# Add or update the dynamic routes for each port
for PORT in "${PORTS[@]}"; do
    DEPLOY_URL="https://${CODESPACE_NAME}-${PORT}.app.github.dev"
    echo "  port${PORT}: '${DEPLOY_URL}'," >> $ROUTES_JS_PATH
done

# Close the object in Routes.js
echo "};" >> $ROUTES_JS_PATH

# Output the result for verification
echo "Routes.js file saved/updated at $ROUTES_JS_PATH with dynamic URLs"

# Step 1: Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Step 2: Run Python app
echo "Starting Python app..."
python3 app.py &  # Run the app in the background

# Step 3: Go to the frontend directory and install react-scripts
echo "Navigating to frontend/ and installing react-scripts..."
cd frontend/
npm start

echo "};" >> $ROUTES_JS_PATH

# Output the result for verification
echo "Routes.js file saved at $ROUTES_JS_PATH with dynamic URLs"
