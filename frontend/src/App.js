import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Login from './components/Login';
import Register from './components/Register';
import TwoFactorAuth from './components/TwoFactorAuth';
import Dashboard from './components/Dashboard';
import AddPatient from './components/AddPatient';
import PatientData from './components/PatientData';
import PatientDataMonth from './components/PatientDataMonth';




const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/2fa" element={<TwoFactorAuth />} />
        <Route path="/dashboard" element={<Dashboard />} />  
        <Route path="/add-patient" element={<AddPatient />} />
        <Route path="/patient-data" element={<PatientData />} /> 
        <Route path="/patient-chart-month" element={<PatientDataMonth />} />
      </Routes>
    </Router>
  );
};

export default App;
