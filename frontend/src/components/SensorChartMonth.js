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

const SensorChartMonth = () => {
  const location = useLocation();
  const patient = location.state;

  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgSaturation, setAvgSaturation] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [allData, setAllData] = useState({
    labels: [],
    data: [],
  });

  // Add a list of available years
  const [availableYears, setAvailableYears] = useState([2023, 2024, 2025, 2026]); // Modify this as needed

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8002/sensor-data');
        const data = response.data;

        if (Array.isArray(data) && data.length > 0) {
          // Filter observations for the current patient and SpO2 data
          const patientObservations = data.filter(
            entry =>
              entry.subject.reference === `Patient/${patient.id}` &&
              entry.code.coding.some(coding => coding.code === '59408-5')
          );

          if (patientObservations.length > 0) {
            // Get the start and end of the selected month
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            // Filter for the selected month's data
            const monthlyObservations = patientObservations.filter(entry => {
              const observationDate = new Date(entry.effectiveDateTime);
              return observationDate >= startOfMonth && observationDate <= endOfMonth;
            });

            const sortedObservations = monthlyObservations.sort((a, b) =>
              new Date(a.effectiveDateTime) - new Date(b.effectiveDateTime)
            );

            const newLabels = sortedObservations.map(entry => entry.effectiveDateTime);
            const newData = sortedObservations.map(entry => entry.valueQuantity.value);

            setAllData({ labels: newLabels, data: newData });

            // Calculate the average saturation for the selected month
            const totalSaturation = newData.reduce((acc, val) => acc + val, 0);
            const avgSaturation = totalSaturation / newData.length;

            setAvgSaturation(avgSaturation.toFixed(2));

            dispatch({
              type: 'UPDATE_CHART',
              payload: {
                labels: newLabels,
                data: newData,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [patient.id, month, year]); // Re-fetch when month or year changes

  const handleMonthChange = (event) => {
    const selectedMonth = parseInt(event.target.value, 10);
    setMonth(selectedMonth); // Set the month
  };

  const handleYearChange = (event) => {
    const selectedYear = parseInt(event.target.value, 10);
    setYear(selectedYear); // Set the year
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
        text: 'Saturation Over the Month',
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
      <p>Avg Saturation for {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}: {avgSaturation}</p>
    </div>
  );
};

export default SensorChartMonth;
