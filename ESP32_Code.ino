#include <WiFi.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <TimeLib.h>  // Install TimeLib by Paul Stoffregen

// Wi-Fi credentials
const char *ssid = "Axl";
const char *password = "awhu9744";

// Server URL
const char *serverURL = "https://verbose-engine-4x774pp5q99h474-8002.app.github.dev/sensor-data";

// NTP setup
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 3600, 60000); // UTC+1 for Berlin time (CET)

// Variables for received data
String receivedData = "";
float BPM = 0, SpO2 = 0;

void setup() {
  Serial.begin(115200);       // Debugging on Serial Monitor
  Serial1.begin(9600, SERIAL_8N1, 16, 17); // Communication with Arduino Uno (RX = GPIO16, TX = GPIO17)

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Start NTP client
  timeClient.begin();
  timeClient.forceUpdate();
}

void loop() {
  // Update time from NTP
  if (!timeClient.update()) {
    timeClient.forceUpdate();
  }

  // Get raw epoch time from NTP
  unsigned long epochTime = timeClient.getEpochTime();

  // Check for invalid or misaligned epoch time (e.g., jump to 2036)
  if (epochTime > 2100000000) {  // Arbitrary threshold for potential future year (2036)
    Serial.println("Time mismatch detected, resetting NTP client...");
    timeClient.forceUpdate();  // Force a time update to fix any discrepancies
    epochTime = timeClient.getEpochTime();  // Re-fetch the correct time
  }



  // Apply the offset of 3600 seconds to get Berlin time (CET - UTC+1)
  time_t localTime = epochTime + 3600;  // Adjust for Berlin Time (UTC+1)

  // Debugging: Print adjusted local time
  String formattedTime = getFormattedTime(localTime);

  // Read data from Arduino Uno
  if (Serial1.available()) {
    receivedData = Serial1.readStringUntil('\n');
    
    // Parse received data
    if (receivedData.startsWith("DATA,")) {
      int commaIndex1 = receivedData.indexOf(',', 5);
      BPM = receivedData.substring(5, commaIndex1).toFloat();
      SpO2 = receivedData.substring(commaIndex1 + 1).toFloat();

      // Simply print the received data (no need to validate since only valid data is sent)
      Serial.print("Data received from arduino: ");
      Serial.print("BPM: ");
      Serial.println(BPM);
      Serial.print("SpO2: ");
      Serial.println(SpO2);

      // Send the data to the server
      sendDataToServer(BPM, SpO2);
    }

    // Clear received data after processing
    receivedData = "";
  }

  // Handle Wi-Fi disconnection and reconnection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Attempting to reconnect...");
    WiFi.reconnect();
  }
}

// Helper function to get the number of days in a specific month of a given year
int dayOfMonth(int year, int month, int day) {
  // Determine if it's a leap year
  bool isLeap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));

  // Days in each month (assuming non-leap year)
  const int daysInMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  
  // Adjust for February in leap year
  if (isLeap && month == 2) {
    return 29;
  } else {
    return daysInMonth[month - 1];
  }
}

// Format time manually
String getFormattedTime(time_t time) {
  int yearInt = year(time);
  int monthInt = month(time);
  int dayInt = day(time);
  int hourInt = hour(time);
  int minuteInt = minute(time);
  int secondInt = second(time);

  // Format date and time as YYYY-MM-DD HH:MM:SS
  char buffer[20];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          yearInt, monthInt, dayInt, hourInt, minuteInt, secondInt);

  return String(buffer);
}

void sendDataToServer(float bpm, float spo2) {
  if (WiFi.status() == WL_CONNECTED) { // Check if connected to Wi-Fi
    HTTPClient http;
    http.begin(serverURL); // Specify server URL
    http.addHeader("Content-Type", "application/json");

    // Get the formatted timestamp
    String sensorTimeStamp = getFormattedTime(timeClient.getEpochTime() + 3600); // Apply Berlin time

    // Print timestamp to Serial Monitor
    Serial.println("Timestamp: " + sensorTimeStamp);    

    // Create the JSON payload
    String json = "{";
    json += "\"BPM\": " + String(bpm) + ", ";
    json += "\"SpO2\": " + String(spo2) + ", ";
    json += "\"sensor_time_stamp\": \"" + sensorTimeStamp + "\", ";
    json += "\"id\": " + String(3);
    json += "}";

    // Calculate content length
    int contentLength = json.length();

    // Add Content-Length header
    http.addHeader("Content-Length", String(contentLength));

    int httpResponseCode = http.POST(json); // Send POST request

    // Print status code and body
    Serial.println("HTTP Status Code: " + String(httpResponseCode));

    if (httpResponseCode > 0) {
      String response = http.getString(); // Get server response
      Serial.println("Server Response Body: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }

    http.end(); // Close connection
  } else {
    Serial.println("Wi-Fi not connected, cannot send data.");
  }
}
