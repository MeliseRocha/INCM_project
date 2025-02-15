import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Install this package
import '../styles/Dashboard.css'; // Import the CSS file for styling
import { Routes } from './Routes'

const apiUrl = Routes.port5000;

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Access token is not available.');
        }

        // Decode the token to get the id
        const decodedToken = jwtDecode(token);
        const doctorId = decodedToken.sub.id;
        if (!doctorId) {
          throw new Error('Doctor ID is not available in the token.');
        }

        // Fetch patients with the doctor ID
        const response = await fetch(`${apiUrl}/get-patients?doctor_id=${doctorId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setPatients(data.patients || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // Clear the token
    navigate('/'); // Navigate to the login page
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
            <button onClick={() => handleSeeStats(patient)} className="see-stats-button">See Live</button>
          </div>
        ))}
      </div>
      <Link to="/add-patient" className="add-patient-button">+</Link>
    </div>
  );
};

export default Dashboard;
