import React from 'react';
import '../styles/Form.css'; // Create a CSS file for styling

const Login = () => {
    return (
      <div className="form-container">
        <form className="form">
          <h1>Login</h1>
          <input type="text" placeholder="Username" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  };

export default Login;