import React, { useState } from 'react';

const PatientRecords = () => {
  const [timeRange, setTimeRange] = useState('lastHour');

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  return (
    <div>
      <h2>Patient Records</h2>
      <label>
        Time Range:
        <select value={timeRange} onChange={handleTimeRangeChange}>
          <option value="lastHour">Last Hour</option>
          <option value="last6Hours">Last 6 Hours</option>
          <option value="lastWeek">Last Week</option>
        </select>
      </label>
      <div>
        {/* Display patient records based on the selected time range */}
        {timeRange === 'lastHour' && <p>Displaying data for the last hour...</p>}
        {timeRange === 'last6Hours' && <p>Displaying data for the last 6 hours...</p>}
        {timeRange === 'lastWeek' && <p>Displaying data for the last week...</p>}
      </div>
    </div>
  );
};

export default PatientRecords;