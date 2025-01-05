import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css'; // Import the CSS file for styling

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1991-01-01',
      gender: 'Male',
      email: 'john.doe@example.com',
      contact: '123-456-7890',
      address: '123 Main St, Anytown, USA',
      medicalHistory: 'No known allergies. Previous surgery in 2015.',
      currentMedications: 'None',
      condition: 'Flu'
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1996-05-15',
      gender: 'Female',
      email: 'jane.smith@example.com',
      contact: '987-654-3210',
      address: '456 Elm St, Othertown, USA',
      medicalHistory: 'Allergic to penicillin. Asthma.',
      currentMedications: 'Inhaler',
      condition: 'Cold'
    },
    // Add more patients as needed
  ]);

  const handleLogout = () => {
    // Handle logout logic here
    console.log('User logged out');
    navigate('/login'); // Navigate to the login page
  };

  const handleSeeStats = (patient) => {
    navigate('/patient-data', { state: patient });
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <div className="patients-list">
        {patients.map(patient => (
          <div key={patient.id} className="patient-item">
            <p><strong>First Name:</strong> {patient.firstName}</p>
            <p><strong>Last Name:</strong> {patient.lastName}</p>
            <p><strong>Date of Birth:</strong> {patient.dateOfBirth}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Email:</strong> {patient.email}</p>
            <p><strong>Contact:</strong> {patient.contact}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <p><strong>Medical History:</strong> {patient.medicalHistory}</p>
            <p><strong>Current Medications:</strong> {patient.currentMedications}</p>
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