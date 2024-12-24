import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AddPatient.css'; // Import the CSS file for styling

const AddPatient = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [condition, setCondition] = useState('');
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('New Patient:', { name, age, gender, contact, address, medicalHistory, currentMedications, condition });
  };

  const handleCancel = () => {
    navigate('/dashboard'); // Navigate back to the Dashboard
  };

  return (
    <div className="add-patient-container">
      <h1>Add New Patient</h1>
      <form onSubmit={handleSubmit} className="add-patient-form">
        <label>
          Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Age:
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        </label>
        <label>
          Gender:
          <input type="text" value={gender} onChange={(e) => setGender(e.target.value)} required />
        </label>
        <label>
          Contact:
          <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} required />
        </label>
        <label>
          Address:
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </label>
        <label>
          Medical History:
          <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} required />
        </label>
        <label>
          Current Medications:
          <textarea value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} required />
        </label>
        <label>
          Condition:
          <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} required />
        </label>
        <div className="form-buttons">
          <button type="submit">Add Patient</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;