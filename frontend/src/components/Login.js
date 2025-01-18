import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import for navigation
import '../styles/Form.css'; // Create a CSS file for styling
import { Routes } from './Routes'

const apiUrl = Routes.port5000;

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const navigate = useNavigate(); // Initialize the navigate hook

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        console.log('Login successful, storing temporary token');
        // Store the temporary token in localStorage
        localStorage.setItem('temporary_token', data.temporary_token);

        // Redirect to the Two-Factor Authentication page
        navigate('/2fa');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during login.');
    }
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
