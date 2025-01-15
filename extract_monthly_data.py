import sqlite3
from datetime import datetime

def update_monthly_data():
    # Connect to the database
    db_connection = sqlite3.connect('database.db')
    cursor = db_connection.cursor()

    # Retrieve daily_data grouped by day and id
    cursor.execute('''
        SELECT 
            DATE(SUBSTR(day_interval, 1, 10)) AS day, 
            id, 
            SUM(total_measurements) AS total_measurements, 
            SUM(total_measurements_above_88) AS total_measurements_above_88
        FROM daily_data
        GROUP BY day, id
    ''')
    daily_data_rows = cursor.fetchall()

    # Insert or update the data into monthly_data
    for row in daily_data_rows:
        day, patient_id, total_measurements, total_above_88 = row
        total_hours_used = (total_above_88 / 1400) * 24

        # Check if the entry already exists
        cursor.execute('''
            SELECT COUNT(*) FROM monthly_data WHERE day_of_the_month = ? AND id = ?
        ''', (day, patient_id))
        exists = cursor.fetchone()[0] > 0

        if exists:
            # Update the existing record
            cursor.execute('''
                UPDATE monthly_data 
                SET total_measurements = ?,
                    total_measurements_above_88 = ?,
                    total_hours_used = ?
                WHERE day_of_the_month = ? AND id = ?
            ''', (total_measurements, total_above_88, total_hours_used, day, patient_id))
        else:
            # Insert a new record
            cursor.execute('''
                INSERT INTO monthly_data (total_measurements, day_of_the_month, total_measurements_above_88, total_hours_used, id)
                VALUES (?, ?, ?, ?, ?)
            ''', (total_measurements, day, total_above_88, total_hours_used, patient_id))

    db_connection.commit()

    # Close the database connection
    db_connection.close()
