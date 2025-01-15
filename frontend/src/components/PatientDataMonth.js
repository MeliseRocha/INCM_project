import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PatientData.css'; // Import the CSS file for styling
import SensorChartMonth from './SensorChartMonth'; // Import the SensorChart component



const PatientDataMonth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state;


  return (
    <div className="patient-data-container">
      <h1>Patient Data Over Month</h1>
      <div className="patient-data">
      <h2>{patient.first_name} {patient.last_name}'s Data</h2>
        <div className="charts-container">
          <SensorChartMonth />

        </div>
      </div>
    </div>
  );
};

export default PatientDataMonth;