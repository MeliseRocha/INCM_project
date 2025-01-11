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

const BeatsChartMonth = () => {
  const location = useLocation();
  const patient = location.state; // Patient data passed through navigation

  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgBeats, setAvgBeats] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth());  // Default to current month
  const [year, setYear] = useState(new Date().getFullYear()); // Default to current year
  const [availableYears, setAvailableYears] = useState([2023, 2024, 2025, 2026]); // Modify this as needed

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8002/sensor-data');
        const data = response.data;
        console.log('Fetched data:', data);

        if (Array.isArray(data) && data.length > 0) {
          // Get the start and end of the selected month and year
          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 0); // The last day of the selected month

          // Get all observations for the current patient and BPM data
          const patientObservations = data.filter(
            entry =>
              entry.subject.reference === `Patient/${patient.id}` &&
              entry.code.coding.some(coding => coding.code === '8867-4') &&
              new Date(entry.effectiveDateTime) >= startOfMonth &&
              new Date(entry.effectiveDateTime) <= endOfMonth // Only take data from the selected month
          );

          if (patientObservations.length > 0) {
            const sortedObservations = patientObservations.sort((a, b) =>
              new Date(a.effectiveDateTime) - new Date(b.effectiveDateTime)
            );

            const newLabels = sortedObservations.map(entry => entry.effectiveDateTime);
            const newData = sortedObservations.map(entry => entry.valueQuantity.value);

            // Calculate the average BPM for the selected month
            const totalBeats = newData.reduce((acc, val) => acc + val, 0);
            const avgBeats = totalBeats / newData.length;

            setAvgBeats(avgBeats.toFixed(2));

            dispatch({
              type: 'UPDATE_CHART',
              payload: {
                labels: newLabels,
                data: newData,
              },
            });
          } else {
            // If no data is available for the selected month, clear the chart
            dispatch({
              type: 'UPDATE_CHART',
              payload: {
                labels: [],
                data: [],
              },
            });
            setAvgBeats(0);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Fetch data whenever month or year changes
  }, [patient.id, month, year]); // Re-fetch when month or year changes

  const handleMonthChange = (event) => {
    const selectedMonth = parseInt(event.target.value, 10);
    setMonth(selectedMonth); // Update month state
  };

  const handleYearChange = (event) => {
    const selectedYear = parseInt(event.target.value, 10);
    setYear(selectedYear); // Update year state
  };

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
        text: 'Beats per Minute Over Time (Monthly)',
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
    <div style={{ width: '1000px', height: '800px' }}>
      <div>
        <select
          onChange={handleYearChange}
          value={year}
          style={{ fontSize: '16px', padding: '8px', marginBottom: '20px' }}
        >
          {availableYears.map((availableYear) => (
            <option key={availableYear} value={availableYear}>
              {availableYear}
            </option>
          ))}
        </select>

        <select
          onChange={handleMonthChange}
          value={month}
          style={{ fontSize: '16px', padding: '8px', marginBottom: '20px' }}
        >
          {Array.from({ length: 12 }).map((_, index) => {
            const monthName = new Date(0, index).toLocaleString('default', { month: 'long' });
            return (
              <option key={index} value={index}>
                {monthName}
              </option>
            );
          })}
        </select>
      </div>

      <Line data={chartData} options={options} />
      <p>Avg BPM for {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}: {avgBeats}</p>
    </div>
  );
};

export default BeatsChartMonth;
