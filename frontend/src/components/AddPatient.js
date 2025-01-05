import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AddPatient.css'; // Import the CSS file for styling

const AddPatient = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [condition, setCondition] = useState('');
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('New Patient:', { firstName, lastName, dateOfBirth, gender, email, contact, address, medicalHistory, currentMedications, condition });
  };

  const handleCancel = () => {
    navigate('/dashboard'); // Navigate back to the Dashboard
  };

  const handleSeeData = () => {
    // Navigate to the PatientData component and pass the patient's data as state
    navigate('/patient-data', { state: { firstName, lastName, dateOfBirth, gender, email, contact, address, medicalHistory, currentMedications, condition } });
  };

  return (
    <div className="add-patient-container">
      <h1>Add New Patient</h1>
      <form onSubmit={handleSubmit} className="add-patient-form">
        <label>
          First Name:
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label>
          Last Name:
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label>
          Date of Birth:
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
        </label>
        <label>
          Gender:
          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
          <button type="button" onClick={handleCancel} className="back-button">Back</button>
          {/* <button type="button" onClick={handleSeeData}>See Data</button> */}
        </div>
      </form>
    </div>
  );
};

export default AddPatient;