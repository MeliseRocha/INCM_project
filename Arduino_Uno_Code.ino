#include <Wire.h>
#include "MAX30100_PulseOximeter.h"

#define REPORTING_PERIOD_MS 30000
#define SDA_PIN A4
#define SCL_PIN A5

#define MIN_BPM 30
#define MAX_BPM 200
#define MIN_SPO2 70
#define MAX_SPO2 100

#define INITIAL_WAIT_TIME_MS 2000 // 2 seconds of waiting for sensor stabilization
#define STABILIZATION_THRESHOLD_BPM 100 // Threshold for initial high BPM reading

PulseOximeter pox;
uint32_t tsLastReport = 0;
float BPM = 0, SpO2 = 0;
bool validReading = false;
bool fingerDetected = false;
uint32_t noFingerDetectedTime = 0;
uint32_t stabilizationStartTime = 0;
bool waitingForStabilization = false;

void setup() {
  Serial.begin(9600); // Serial communication with ESP32
  Wire.begin();
  
  // Initialize Pulse Oximeter
  Serial.print("Initializing pulse oximeter...");
  if (!pox.begin()) {
    Serial.println("Failed to initialize Pulse Oximeter!");
    while (1);
  }

  // Set LED current for better performance
  pox.setIRLedCurrent(MAX30100_LED_CURR_27_1MA);
  Serial.println("Pulse Oximeter initialized.");
}

void loop() {
  pox.update();

  if (millis() - tsLastReport > REPORTING_PERIOD_MS) {
    float currentBPM = pox.getHeartRate();
    float currentSpO2 = pox.getSpO2();

    // Check if finger is detected and if reading is valid
    if (currentBPM >= MIN_BPM && currentBPM <= MAX_BPM && currentSpO2 >= MIN_SPO2 && currentSpO2 <= MAX_SPO2) {
      if (!fingerDetected) {
        fingerDetected = true;
        noFingerDetectedTime = 0; // Reset no finger time when the finger is detected
        waitingForStabilization = true;
        stabilizationStartTime = millis(); // Start waiting for stabilization
      }

      // If waiting for stabilization (first readings after finger placement)
      if (waitingForStabilization) {
        // Ignore initial outlier reading, wait until second valid reading
        if (currentBPM > STABILIZATION_THRESHOLD_BPM) {
          Serial.println("Initial high reading detected, waiting for stabilization...");
        } else {
          // After the second reading, accept stabilized readings
          waitingForStabilization = false; // Exit stabilization mode
          BPM = currentBPM;
          SpO2 = currentSpO2;
          validReading = true;
        }
      } else {
        // Accept stable readings after stabilization
        BPM = currentBPM;
        SpO2 = currentSpO2;
        validReading = true;
      }
    } else {
      // If no valid readings and finger is not detected, set the flag
      if (!fingerDetected) {
        noFingerDetectedTime = millis();
      }
      validReading = false;
      if (millis() - noFingerDetectedTime > INITIAL_WAIT_TIME_MS) {
        // After waiting, allow new readings when finger is detected
        fingerDetected = false; // Reset finger detection
      }
    }

    // If valid reading, output data
    if (validReading) {
      Serial.print("BPM: ");
      Serial.println(BPM);
      Serial.print("SpO2: ");
      Serial.println(SpO2);
      Serial.println("*********************************");

      sendDataToESP32(BPM, SpO2); // Send valid data directly
    } else {
      Serial.println("No finger detected or invalid readings.");
    }

    tsLastReport = millis();
  }
}

// Simplified sendDataToESP32 function without redundant checks
void sendDataToESP32(float bpm, float spo2) {
  // Format and send the data over Serial
  Serial.print("DATA,");
  Serial.print(bpm);
  Serial.print(",");
  Serial.println(spo2);
}
