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
        const response = await axios.get(`http://localhost:8002/sensor-data?id=${patient.id}`);
        const data = response.data;
        console.log('Fetched data:', data);

        if (Array.isArray(data) && data.length > 0) {
          // Filter observations for the current patient and BPM data
          const patientObservations = data.filter(
            entry =>
              entry.code.coding.some(coding => coding.code === '8867-4')
          );

          if (patientObservations.length > 0) {
            const sortedObservations = patientObservations.sort((a, b) =>
              new Date(a.effectiveDateTime) - new Date(b.effectiveDateTime)
            );

            const newLabels = sortedObservations.map(entry => entry.effectiveDateTime);
            const newData = sortedObservations.map(entry => entry.valueQuantity.value);

            // Take the 8 most recent entries
            const recentLabels = newLabels.slice(-8);
            const recentData = newData.slice(-8);

            const totalBeats = recentData.reduce((acc, val) => acc + val, 0);
            const avgBeats = totalBeats / recentData.length;

            setAvgBeats(avgBeats.toFixed(2));

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

    fetchData(); // Initial fetch on component mount

    const intervalDuration = 30000; // Fetch new data every 3 seconds
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
