import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css'; // Import the CSS file for styling

const Dashboard = () => {
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: 'John Doe',
      age: 30,
      gender: 'Male',
      contact: '123-456-7890',
      address: '123 Main St, Anytown, USA',
      medicalHistory: 'No known allergies. Previous surgery in 2015.',
      currentMedications: 'None',
      condition: 'Flu'
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 25,
      gender: 'Female',
      contact: '987-654-3210',
      address: '456 Elm St, Othertown, USA',
      medicalHistory: 'Allergic to penicillin. Asthma.',
      currentMedications: 'Inhaler',
      condition: 'Cold'
    },
    // Add more patients as needed
  ]);

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="patients-list">
        {patients.map(patient => (
          <div key={patient.id} className="patient-item">
            <p><strong>Name:</strong> {patient.name}</p>
            <p><strong>Age:</strong> {patient.age}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Contact:</strong> {patient.contact}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <p><strong>Medical History:</strong> {patient.medicalHistory}</p>
            <p><strong>Current Medications:</strong> {patient.currentMedications}</p>
            <p><strong>Condition:</strong> {patient.condition}</p>
          </div>
        ))}
      </div>
      <Link to="/add-patient" className="add-patient-button">+</Link>
    </div>
  );
};

export default Dashboard;