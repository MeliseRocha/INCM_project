import React, { useEffect, useReducer, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const initialState = {
  labels: [],
  datasets: [
    {
      label: 'Beats per Minute',
      data: [],
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.2)',
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

const BeatsChart = () => {
  const location = useLocation();
  const patient = location.state; // Patient data passed through navigation

  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgBeats, setAvgBeats] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8002/sensor-data');
        const data = response.data;
        console.log('Fetched data:', data);

        if (Array.isArray(data) && data.length > 0) {
          const patientData = data.find(entry => entry.id === patient.id);

          if (patientData && patientData.data.length > 0) {
            const latestEntries = patientData.data.slice(-8); // Get the latest 8 entries
            const latestLabels = latestEntries.map(entry => entry.time);
            const latestData = latestEntries.map(entry => entry.BPM);

            const totalBeats = latestData.reduce((acc, val) => acc + val, 0);
            const avgBeats = totalBeats / latestData.length;

            setAvgBeats(avgBeats.toFixed(2));

            dispatch({
              type: 'UPDATE_CHART',
              payload: {
                labels: latestLabels,
                data: latestData,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Initial fetch on component mount

    const intervalDuration = 3000; // Fetch new data every 3 seconds
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
        text: 'Beats per Minute Over Time',
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
          text: 'Beats per Minute',
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
        min: 0,
        max: 200,
      },
    },
  };

  return (
    <div style={{ width: '700px', height: '600px' }}>
      <Line data={chartData} options={options} />
      <p>Avg BPM: {avgBeats}</p>
    </div>
  );
};

export default BeatsChart;
