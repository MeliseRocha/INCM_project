import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PatientData.css'; // Import the CSS file for styling
import BeatsChartMonth from './BeatsChartMonth'; // Import the BeatsChart component
import SensorChartMonth from './SensorChartMonth'; // Import the SensorChart component



const PatientDataMonth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state;

  const handleBack = () => {
    navigate('/dashboard'); // Navigate back to the Dashboard
  };

  return (
    <div className="patient-data-container">
      <h1>Patient Data Over Time</h1>
      <button onClick={handleBack} className="back-button">Back</button>
      <div className="patient-data">
      <h2>{patient.first_name} {patient.last_name}'s Data</h2>
        <div className="charts-container">
          <SensorChartMonth />
          <BeatsChartMonth />

        </div>
      </div>
    </div>
  );
};

export default PatientDataMonth;