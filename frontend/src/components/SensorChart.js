import React, { useEffect, useReducer, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const initialState = {
  labels: [],
  datasets: [
    {
      label: 'Saturation',
      data: [],
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
    },
  ],
};

const chartReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_CHART':
      return {
        ...state,
        labels: action.payload.labels,
        datasets: [{ ...state.datasets[0], data: action.payload.data }],
      };
    default:
      return state;
  }
};

const SensorChart = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = location.state;

  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgSaturation, setAvgSaturation] = useState(0);
  const [allData, setAllData] = useState({
    labels: [],
    data: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8002/sensor-data');

        const data = response.data;
        console.log('Fetched data:', data);

        if (Array.isArray(data) && data.length > 0) {
          const patientData = data.find(entry => entry.id === patient.id);
          if (patientData && patientData.data.length > 0) {
            const newLabels = patientData.data.map(entry => entry.time);
            const newData = patientData.data.map(entry => entry.SpO2);

            setAllData({ labels: newLabels, data: newData });

            const recentLabels = newLabels.slice(-8);
            const recentData = newData.slice(-8);

            const totalSaturation = recentData.reduce((acc, val) => acc + val, 0);
            const avgSaturation = totalSaturation / recentData.length;

            setAvgSaturation(avgSaturation.toFixed(2));

            dispatch({
              type: 'UPDATE_CHART',
              payload: {
                labels: recentLabels,
                data: recentData,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const intervalDuration = 3000;
    const interval = setInterval(fetchData, intervalDuration);

    return () => clearInterval(interval);
  }, [patient.id]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(200, 200, 200, 0.8)',
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: 'Saturation Over Time',
        color: 'rgba(200, 200, 200, 0.8)',
        font: {
          size: 18,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: 'rgba(200, 200, 200, 0.8)',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: 'rgba(200, 200, 200, 0.8)',
          font: {
            size: 14,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Saturation',
          color: 'rgba(200, 200, 200, 0.8)',
          font: {
            size: 16,
          },
        },
        ticks: {
          color: 'rgba(200, 200, 200, 0.8)',
          font: {
            size: 14,
          },
        },
        min: 50,
        max: 100,
      },
    },
  };

  return (
    <div style={{ width: '700px', height: '600px' }}>
      <Line data={chartData} options={options} />
      <p>Avg Saturation: {avgSaturation}</p>
    </div>
  );
};

export default SensorChart;
