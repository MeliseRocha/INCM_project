import React from 'react';
import '../styles/AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-container">
      <div className="content">
        <h1>About Us</h1>
        <p>
          We are a team of dedicated students from the Health Informatics BSc program at Technische Hochschule Deggendorf. Our team members—Melise Rocha, Anastasiia Bulatkina, Lucas Barros, and Jayson Dabu—bring together diverse skills and a shared passion for healthcare innovation.
        </p>
        <p>
          Our project aims to bridge technology and healthcare through an advanced application that monitors heart rate and oxygen saturation. Integrated with Arduino, our platform provides real-time data to healthcare professionals, allowing them to track their patients' vitals over an extended period of time, such as a month.
        </p>
        <p>
          Doctors can access live updates on patients' heart rates and oxygen saturation levels, and receive immediate notifications if a patient's oxygen saturation drops below 88%. This proactive approach helps in providing timely medical intervention, ensuring better patient care and safety.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
