import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css'; // Create a CSS file for styling

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="rectangle">
        <ul>
          <li><Link to="/about-us">About Us</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;