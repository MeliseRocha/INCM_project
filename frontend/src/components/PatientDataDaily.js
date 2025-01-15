import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PatientData.css'; // Import the CSS file for styling
import DailySensorChart from './SaturationChartDaily'; // Import the BeatsChart component



const SaturationDataDaily = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state;

  const handleBack = () => {
    navigate('/patient-chart-month', { state: patient }); // Navigate back to the Dashboard
  };

  return (
    <div className="patient-data-container">
      <h1>Patient Saturation Data Over Last Day</h1>
      <button onClick={handleBack} className="back-button">See Monthly Data</button>
      <div className="patient-data">
      <h2>{patient.first_name} {patient.last_name}'s Latest Available Data</h2>
        <div className="charts-container">
          <DailySensorChart />

        </div>
      </div>
    </div>
  );
};

export default SaturationDataDaily;