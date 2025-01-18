import sqlite3
from datetime import datetime, timedelta

def process_measurements():
    with sqlite3.connect('database.db') as conn:
        cursor = conn.cursor()

        # Query all the data from the measurements table
        cursor.execute('SELECT spo2, bpm, timestamp, id FROM measurements')
        measurements = cursor.fetchall()

        # Loop through each patient id to group the measurements by date and time interval
        patients_data = {}

        for spo2, bpm, timestamp, patient_id in measurements:
            # Convert timestamp to datetime object
            timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
            day_of_year = timestamp.strftime('%Y-%m-%d')
            hour_interval = timestamp.hour

            # Store data by patient id and group by day interval
            if patient_id not in patients_data:
                patients_data[patient_id] = {}

            if day_of_year not in patients_data[patient_id]:
                patients_data[patient_id][day_of_year] = {}

            if hour_interval not in patients_data[patient_id][day_of_year]:
                patients_data[patient_id][day_of_year][hour_interval] = {
                    'measurements': [],
                    'total_spo2': 0,
                    'above_88_count': 0
                }

            # Add the measurement data for that hour
            patients_data[patient_id][day_of_year][hour_interval]['measurements'].append(spo2)
            patients_data[patient_id][day_of_year][hour_interval]['total_spo2'] += spo2

            # Increment count if spo2 > 88
            if spo2 > 88:
                patients_data[patient_id][day_of_year][hour_interval]['above_88_count'] += 1

        # Loop through patients and insert data into daily_data table
        all_hours_in_day = list(range(24))  # List of all hours in a day (0 to 23)

        for patient_id, days in patients_data.items():
            for day in days:
                # Insert data for all hours (even if no data for the hour)
                for hour in all_hours_in_day:
                    # Calculate time interval for the current hour (start and end time)
                    day_interval_start = f'{day} {hour:02d}:00:00'
                    day_interval_end = (datetime.strptime(day_interval_start, "%Y-%m-%d %H:%M:%S") + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
                    day_interval = f'{day_interval_start} - {day_interval_end}'

                    # Check if this entry already exists
                    cursor.execute('''
                        SELECT COUNT(*)
                        FROM daily_data
                        WHERE id = ? AND day_interval = ?
                    ''', (patient_id, day_interval))
                    exists = cursor.fetchone()[0] > 0

                    if exists:
                        # Skip processing if entry exists
                        continue

                    # Check if data for the hour exists
                    if hour in days[day]:
                        data = days[day][hour]
                        total_measurements = len(data['measurements'])
                        total_measurements_above_88 = data['above_88_count']

                        if total_measurements > 40:
                            avg_spo2 = sum(data['measurements']) / total_measurements
                        else:
                            avg_spo2 = None

                        # Insert the data for the current time interval
                        cursor.execute('''
                            INSERT INTO daily_data (total_measurements, total_measurements_above_88, day_interval, id, avg_spo2)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (total_measurements if total_measurements > 0 else None, total_measurements_above_88, day_interval, patient_id, avg_spo2))
                    else:
                        # If no data for this hour, insert with None
                        cursor.execute('''
                            INSERT INTO daily_data (total_measurements, total_measurements_above_88, day_interval, id, avg_spo2)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (None, None, day_interval, patient_id, None))

        # Step 1: Get all measurements, grouped by patient id, and keep only the latest 8 for each
        patient_measurements = {}

        # Get all measurements ordered by patient_id and timestamp
        cursor.execute('''
            SELECT id, timestamp
            FROM measurements
            ORDER BY id, timestamp DESC
        ''')
        all_measurements = cursor.fetchall()

        # Organize measurements by patient_id
        for patient_id, timestamp in all_measurements:
            if patient_id not in patient_measurements:
                patient_measurements[patient_id] = []

            patient_measurements[patient_id].append(timestamp)

        # Step 2: For each patient, keep the latest 8 timestamps
        for patient_id, timestamps in patient_measurements.items():
            latest_8_timestamps = timestamps[:8]

            # Delete all measurements except the latest 8
            cursor.execute(f'''
                DELETE FROM measurements
                WHERE id = {patient_id} AND timestamp NOT IN ({', '.join([f"'{timestamp}'" for timestamp in latest_8_timestamps])})
            ''')

        # Commit the changes
        conn.commit()

    conn.close()
