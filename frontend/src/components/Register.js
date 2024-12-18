import React from 'react';
import '../styles/Form.css'; // Import the form styling

const Register = () => {
  return (
    <div className="form-container">
      <form className="form">
        <h1>Register</h1>
        <input type="text" placeholder="Name" />
        <input type="text" placeholder="Last Name" />
        <input type="text" placeholder="Username" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;