import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useLocation } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

const SensorChartMonth = () => {
  const location = useLocation();
  const patient = location.state;
  const patientId = patient.id;

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [lowMeasurementDays, setLowMeasurementDays] = useState([]);
  const [zeroMeasurementDays, setZeroMeasurementDays] = useState([]);

  const availableYears = [2023, 2024, 2025, 2026];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/monthly_data/${patientId}?month=${month + 1}&year=${year}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setChartData(data.data);
        setLowMeasurementDays(data.low_measurement_days);
        setZeroMeasurementDays(data.zero_measurement_days); // Set the zero measurement days
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [patientId, month, year]);
  

  const handleMonthChange = (event) => {
    setMonth(parseInt(event.target.value, 10));
  };

  const handleYearChange = (event) => {
    setYear(parseInt(event.target.value, 10));
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
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of the Month',
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
          text: 'Total Hours of Saturation Above 88%',
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
        max: 24,
      },
    },
  };

  const data = {
    labels: chartData.map((item) => item.day_of_the_month),
    datasets: [
      {
        label: 'Hours With Saturation Above 88',
        data: chartData.map((item) => item.total_hours_used),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        pointStyle: 'circle',
        pointRadius: 5,
      },
    ],
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

      <Line data={data} options={options} />

      {lowMeasurementDays.length > 0 && (
        <div style={{ marginTop: '20px', color: 'red', fontSize: '16px' }}>
          <strong>Not Enough Information For The Days:</strong> {lowMeasurementDays.join(', ')}
        </div>
      )}

      {zeroMeasurementDays.length > 0 && (
        <div style={{ marginTop: '20px', color: 'orange', fontSize: '16px' }}>
          <strong>Zero Measurements For The Days:</strong> {zeroMeasurementDays.join(', ')}
        </div>
      )}
    </div>
  );
};

export default SensorChartMonth;
