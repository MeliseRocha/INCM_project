import sqlite3
from datetime import datetime, timedelta
import random

# Connect to the database
db_name = "database.db"
conn = sqlite3.connect(db_name)
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS measurements (
        spo2 REAL,
        bpm REAL,
        timestamp DATETIME,
        timestamp_esp32 DATETIME,
        id INTEGER NOT NULL,
        FOREIGN KEY (id) REFERENCES patients (id)
    )
''')

# Generate data for December 2024
def generate_data():
    start_time = datetime(2024, 12, 30, 0, 0, 0)
    end_time = datetime(2024, 12, 31, 0, 0, 0)
    current_time = start_time
    data = []

    while current_time < end_time:
        # Skip measurements from 10:00-11:00 and 18:00-19:00
        if (10 <= current_time.hour < 11) or (18 <= current_time.hour < 19):
            current_time += timedelta(minutes=1)
            continue  # Skip to the next minute if it's in the restricted time range
        
        # For each day, randomly select the number of low SpO2 hours (between 4 and 10)
        low_spo2_hours_count = random.randint(4, 10)
        low_spo2_hours = random.sample(range(0, 24), k=low_spo2_hours_count)  # Randomly select that many hours for this day
        
        hour = current_time.hour
        # Determine SPO2 range based on the randomly selected hours
        if hour in low_spo2_hours:
            spo2 = random.uniform(85, 88)  # Spo2 between 85 and 88
        elif (9 <= hour < 11):  # Morning range
            spo2 = random.uniform(92, 95)  # Spo2 between 92 and 95
        else:
            spo2 = random.uniform(96, 98)  # Spo2 between 96 and 98

        bpm = random.uniform(60, 100)  # BPM between 60 and 100
        id_ = 2  # Set all IDs to 2
        timestamp = current_time.strftime("%Y-%m-%d %H:%M:%S")
        timestamp_esp32 = (current_time - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")

        data.append((round(spo2, 1), round(bpm, 1), timestamp, timestamp_esp32, id_))
        current_time += timedelta(minutes=1)  # Increment by one minute
    
    return data

# Insert generated data into the table
data = generate_data()
cursor.executemany(
    "INSERT INTO measurements (spo2, bpm, timestamp, timestamp_esp32, id) VALUES (?, ?, ?, ?, ?);", 
    data
)

# Commit changes and close the connection
conn.commit()
conn.close()

print(f"Inserted {len(data)} rows into the measurements table.")
