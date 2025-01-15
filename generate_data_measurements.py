import sqlite3
from datetime import datetime, timedelta
import random

# Connect to the database
db_name = "database.db"
conn = sqlite3.connect(db_name)
cursor = conn.cursor()

# Create the measurements table if it does not exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER,
    spo2 REAL,
    bpm REAL,
    timestamp TEXT
);
''')

# Generate data for January 15, 2025
def generate_data():
    start_time = datetime(2025, 1, 15, 0, 0, 0)
    end_time = datetime(2025, 1, 16, 0, 0, 0)
    current_time = start_time
    data = []

    while current_time < end_time:
        hour = current_time.hour
        
        # Determine SPO2 range based on the hour interval
        if (13 <= hour < 14) or (16 <= hour < 17) or (1 <= hour < 2):
            spo2 = random.uniform(85, 88)  # Spo2 between 85 and 88
        elif (9 <= hour < 10) or (10 <= hour < 11):
            spo2 = random.uniform(92, 95)  # Spo2 between 92 and 95
        else:
            spo2 = random.uniform(96, 98)  # Spo2 between 96 and 98
        
        bpm = random.uniform(60, 100)  # BPM between 60 and 100
        id_ = 1  # Set all IDs to 1

        data.append((id_, round(spo2, 1), round(bpm, 1), current_time.strftime("%Y-%m-%d %H:%M:%S")))
        current_time += timedelta(minutes=1)

    return data

# Insert generated data into the table
data = generate_data()
cursor.executemany("INSERT INTO measurements (id, spo2, bpm, timestamp) VALUES (?, ?, ?, ?);", data)

# Commit changes and close the connection
conn.commit()
conn.close()

print(f"Inserted {len(data)} rows into the measurements table.")
