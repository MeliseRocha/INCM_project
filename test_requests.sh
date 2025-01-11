#!/bin/bash

for i in {1..100}  # Adjust the range to control the number of requests
do
  BPM=$((60 + RANDOM % 40))   # Random BPM between 60 and 100
  SpO2=$((80 + RANDOM % 11))  # Random SpO2 between 90 and 100
  id=7                       # Fixed ID value

  curl -X POST http://localhost:8002/sensor-data \
    -H "Content-Type: application/json" \
    -d "{\"BPM\": $BPM, \"SpO2\": $SpO2, \"id\": $id}"

  echo "Request $i sent with BPM=$BPM, SpO2=$SpO2, id=$id"

  # Wait for 30 seconds before sending the next request
  
done


