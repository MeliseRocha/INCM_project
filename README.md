# INCM_project
# Project Setup Guide

Follow these steps to set up and run the project:

## Step 1: Start the Codespace Environment
1. Ensure you are on the `master` branch.
2. Launch a Codespace environment for the project.

## Step 2: Run the Setup Script
1. Open the terminal in your Codespace.
2. Execute the setup script by typing:
   ```bash
   ./setup.sh
   ```

## Step 3: Configure Port Visibility
1. Navigate to the **PORTS** tab in your Codespace.
2. Locate the following ports:
   - `3002`
   - `5000`
   - `8002`
3. For each port:
   - Right-click on the port number.
   - Select **Port Visibility**.
   - Change the visibility setting to **Public**.

## Step 4: Access the Application
1. Go to port `3002` in the **PORTS** tab.
2. Under **Forwarded Address**, click the link while holding **Ctrl** (or Cmd on macOS).
3. This will open the application in your browser.

## Step 5: Login or Register
1. To log in and see some data for patients, use the following credentials:
   - **Username**: `melise`
   - **Password**: `123`
2. Alternatively, you can register a new account directly within the application. Go to **Register** in the homepage to do that.

---

### Notes
- Make sure all dependencies are properly installed during the setup script execution.
- If you encounter any issues, refer to the troubleshooting section in the project documentation or contact the project maintainer.

