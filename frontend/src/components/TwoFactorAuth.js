import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';

const TwoFactorAuth = () => {
  const [authCode, setAuthCode] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('temporary_token')}`,
        },
        body: JSON.stringify({ verification_code: authCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the access token in localStorage
        localStorage.setItem('access_token', data.access_token);

        // Navigate to the dashboard
        navigate('/dashboard');
      } else {
        // Handle invalid verification code or other errors
        alert(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while verifying the code. Please try again later.');
    }
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleVerify}>
        <h1>Two-Factor Authentication</h1>
        <p style={{ color: 'white' }}>Enter Your Received Authentication Code In The Registered E-mail.</p>
        <input
          type="text"
          placeholder="Authentication Code"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
};

export default TwoFactorAuth;
