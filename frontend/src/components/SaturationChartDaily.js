import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
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
import { useLocation } from 'react-router-dom';

import { Routes } from './Routes'

const apiUrl = Routes.port5000;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

const DailySensorChart = () => {
  const location = useLocation();
  const patient = location.state; // Getting the patient ID
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Saturation Average',
        data: [],
        borderColor: 'transparent',
        pointBackgroundColor: [],
        segment: {
          borderColor: (ctx) => (ctx.p0.parsed.y < 88 ? 'red' : 'blue'), // Red for below threshold, blue for above
        },
      },
    ],
  });
  const [latestDay, setLatestDay] = useState('');
  const [missingIntervals, setMissingIntervals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/daily_data/${patient.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        if (data && data.data) {
          // Determine the missing intervals
          const fullIntervals = Array.from(
            { length: 24 },
            (_, i) => `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
          );
          const availableData = data.data;
          const missing = fullIntervals.filter((_, i) => availableData[i] === 0);

          // Generate dynamic colors for points
          const pointColors = availableData.map((value) => (value < 88 ? 'red' : 'blue'));

          setChartData({
            labels: fullIntervals.filter((_, i) => availableData[i] !== 0),
            datasets: [
              {
                label: 'Saturation Average',
                data: availableData.filter((value) => value !== 0),
                borderColor: 'transparent',
                pointBackgroundColor: pointColors, // Dynamic point colors
                segment: {
                  borderColor: (ctx) => (ctx.p0.parsed.y < 88 ? 'red' : 'blue'), // Dynamic line segment colors
                },
              },
            ],
          });

          setLatestDay(data.latest_day);
          setMissingIntervals(missing);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // If there's an error, ensure chart renders without data
        setChartData({
          labels: [],
          datasets: [
            {
              label: 'Saturation Average',
              data: [],
              borderColor: 'transparent',
              pointBackgroundColor: [],
              segment: {
                borderColor: (ctx) => (ctx.p0.parsed.y < 88 ? 'red' : 'blue'),
              },
            },
          ],
        });
      }
    };

    fetchData();
  }, [patient.id]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(200, 200, 200, 0.8)',
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: `Saturation Averages for Day ${latestDay || 'Latest'}`,
        color: 'rgba(200, 200, 200, 0.8)',
        font: { size: 18 },
      },
      annotation: {
        annotations: {
          redLine: {
            type: 'line',
            yMin: 88,
            yMax: 88,
            borderColor: 'red',
            borderWidth: 2,
            label: {
              enabled: true,
              content: 'Critical Threshold (88)',
              position: 'end',
              color: 'red',
              font: { size: 12 },
            },
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Time Intervals', color: 'rgba(200, 200, 200, 0.8)', font: { size: 16 } },
        ticks: { color: 'rgba(200, 200, 200, 0.8)', font: { size: 14 } },
      },
      y: {
        title: { display: true, text: 'Saturation Average', color: 'rgba(200, 200, 200, 0.8)', font: { size: 16 } },
        ticks: { color: 'rgba(200, 200, 200, 0.8)', font: { size: 14 } },
        min: 80,
        max: 100,
      },
    },
    elements: { line: { tension: 0.3 } }, // Smoothing the line
  };

  return (
    <div style={{ width: '1000px', height: '800px' }}>
      <Line data={chartData} options={options} />
      {missingIntervals.length > 0 && (
        <div style={{ marginTop: '20px', color: 'red', fontSize: '16px' }}>
          <strong>Not enough measurements for time intervals:</strong> {missingIntervals.join(', ')}
        </div>
      )}
    </div>
  );
};

export default DailySensorChart;
