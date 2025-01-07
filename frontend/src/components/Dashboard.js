import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css'; // Import the CSS file for styling

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch patients from the API
    const fetchPatients = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-patients");
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setPatients(data.patients || []); // Ensure it handles cases where "patients" is undefined
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      // Push the same state to prevent navigating back
      window.history.pushState(null, null, window.location.href);
    };

    // Add a new state to the history stack
    window.history.pushState(null, null, window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('User logged out');
    navigate('/login'); // Navigate to the login page
  };

  const handleSeeStats = (patient) => {
    navigate('/patient-data', { state: patient }); // Pass the entire patient object
  };
  

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="patients-list">
        {patients.map(patient => (
          <div key={patient.email} className="patient-item">
            <p><strong>Id:</strong> {patient.id}</p>
            <p><strong>First Name:</strong> {patient.first_name}</p>
            <p><strong>Last Name:</strong> {patient.last_name}</p>
            <p><strong>Date of Birth:</strong> {patient.date_of_birth}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Email:</strong> {patient.email}</p>
            <p><strong>Contact:</strong> {patient.contact}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <p><strong>Medical History:</strong> {patient.medical_history}</p>
            <p><strong>Current Medications:</strong> {patient.current_medication}</p>
            <p><strong>Condition:</strong> {patient.condition}</p>
            <button onClick={() => handleSeeStats(patient)} className="see-stats-button">See Stats</button>
          </div>
        ))}
      </div>
      <Link to="/add-patient" className="add-patient-button">+</Link>
    </div>
  );
};

export default Dashboard;

