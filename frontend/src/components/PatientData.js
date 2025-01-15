import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PatientData.css'; // Import the CSS file for styling
import BeatsChart from './BeatsChart'; // Import the BeatsChart component
import SensorChart from './SensorChart'; // Import the SensorChart component





const PatientData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state;

  const handleBack = () => {
    navigate('/dashboard'); // Navigate back to the Dashboard
  };
  const handleSeeMonthlyData = () => {
    navigate('/patient-chart-month', { state: patient }); // Navigate to SensorChartMonth and pass patient data
  };
  const handleSeeDailyData = () => {
    navigate('/patient-chart-daily', { state: patient }); // Navigate to SensorChartMonth and pass patient data
  };


  return (
    <div className="patient-data-container">
      <h1>Patient Data</h1>
      <button onClick={handleBack} className="back-button">Back</button>
      <button onClick={handleSeeDailyData} className="back-button">See Daily Data</button>
      <button onClick={handleSeeMonthlyData} className="back-button">See Monthly Data</button>
      <div className="patient-data">
      <h2>{patient.first_name} {patient.last_name}'s Data</h2>
        <div className="charts-container">
          <SensorChart/>
          <BeatsChart/>


        </div>
      </div>
    </div>
  );
};

export default PatientData;