
import './App.css';
import SensorChart from './components/SensorChart';
import BeatsChart from './components/BeatsChart';
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sensor Data</h1>
        <SensorChart />
        <BeatsChart />
      </header>
    </div>
  );
}

export default App;
