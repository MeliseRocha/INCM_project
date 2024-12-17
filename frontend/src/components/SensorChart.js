import React, { useEffect, useReducer, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

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
  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgSaturation, setAvgSaturation] = useState(0);
  const [visibleRange, setVisibleRange] = useState([0, 10]);
  const [isSliderAtEnd, setIsSliderAtEnd] = useState(true);
  const [allData, setAllData] = useState({
    labels: [],
    data: [],
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://reimagined-eureka-7vv9wpq6pp47hr4gv-5001.app.github.dev/sensor-data'); // Adjust the URL as needed
        const data = await response.json();
        console.log('Fetched data:', data); // Debugging: Log the fetched data

        // Check if data is an array and has the expected structure
        if (Array.isArray(data) && data.length > 0) {
          const latestData = data[data.length - 1]; // Get the latest data point
          const latestSpO2 = latestData.SpO2; // Get SpO2 from the latest data point

          // Check if the last data point is different from the previous one
          setAllData(prevData => {
            const lastSpO2 = prevData.data[prevData.data.length - 1]; // Last SpO2 value in current state

            // Only update if the new data is different from the last data
            if (latestSpO2 !== lastSpO2) {
              const now = new Date();
              const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

              const newLabels = [...prevData.labels, time];
              const newData = [...prevData.data, latestSpO2];

              console.log('New Labels:', newLabels); // Debugging: Log new labels
              console.log('New Data:', newData); // Debugging: Log new data

              const totalSaturation = newData.reduce((acc, val) => acc + val, 0);
              const avgSaturation = totalSaturation / newData.length;

              setAvgSaturation(avgSaturation.toFixed(2));

              const newVisibleRange = isSliderAtEnd
                ? [Math.max(0, newLabels.length - 10), newLabels.length]
                : visibleRange;

              setVisibleRange(newVisibleRange);

              dispatch({
                type: 'UPDATE_CHART',
                payload: {
                  labels: newLabels,
                  data: newData,
                },
              });

              return {
                labels: newLabels,
                data: newData,
              };
            } else {
              console.log('No new data, skipping update.');
              return prevData; // Return the previous data if no change
            }
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const intervalDuration = 3000; // 3 seconds interval
    const interval = setInterval(fetchData, intervalDuration);

    return () => clearInterval(interval);
  }, [isSliderAtEnd, visibleRange, chartData.datasets]);

  

  

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setVisibleRange([value, value + 10]);
    setIsSliderAtEnd(value + 10 >= chartData.labels.length);
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(200, 200, 200, 0.8)', // Lighter color for legend labels
          font: {
            size: 14, // Font size for legend labels
          },
        },
      },
      title: {
        display: true,
        text: 'Saturation Over Time',
        color: 'rgba(200, 200, 200, 0.8)', // Lighter color for title
        font: {
          size: 18, // Font size for title
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
          color: 'rgba(200, 200, 200, 0.8)', // Lighter color for x-axis title
          font: {
            size: 16, // Font size for x-axis title
          },
        },
        ticks: {
          color: 'rgba(200, 200, 200, 0.8)', // Lighter color for x-axis labels
          font: {
            size: 14, // Font size for x-axis labels
          },
        },
        min: visibleRange[0],
        max: visibleRange[1],
      },
      y: {
        title: {
          display: true,
          text: 'Saturation',
          color: 'rgba(200, 200, 200, 0.8)', // Lighter color for y-axis title
          font: {
            size: 16, // Font size for y-axis title
          },
        },
        ticks: {
          color: 'rgba(200, 200, 200, 0.8)', // Lighter color for y-axis labels
          font: {
            size: 14, // Font size for y-axis labels
          },
        },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div style={{ width: '700px', height: '600px' }}>
      <Line data={chartData} options={options} />
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <input
          type="range"
          min="0"
          max={Math.max(0, chartData.labels.length - 10)}
          value={visibleRange[0]}
          onChange={handleSliderChange}
          style={{ width: '100%', marginTop: '10px' }}
        />
      </div>
      <p>Avg Saturation: {avgSaturation}</p>
    </div>
  );
};

export default SensorChart;