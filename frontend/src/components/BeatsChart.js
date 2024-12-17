import React, { useEffect, useReducer, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

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
        datasets: [
          {
            ...state.datasets[0],
            data: action.payload.data,
          },
        ],
      };
    default:
      return state;
  }
};

const BeatsChart = () => {
  const [chartData, dispatch] = useReducer(chartReducer, initialState);
  const [avgBeats, setAvgBeats] = useState(0);
  const [visibleRange, setVisibleRange] = useState([0, 10]);
  const [isSliderAtEnd, setIsSliderAtEnd] = useState(true);
  const [timeUnit, setTimeUnit] = useState('seconds');
  const [allData, setAllData] = useState({
    seconds: { labels: [], data: [] },
    minutes: { labels: [], data: [] },
    hours: { labels: [], data: [] },
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://reimagined-eureka-7vv9wpq6pp47hr4gv-5001.app.github.dev/sensor-data');
        const data = await response.json();
        console.log('Fetched data:', data); // Log the data to verify its structure
    
        if (data.length > 0 && data[data.length - 1].BPM !== undefined) {
          const latestBPM = data[data.length - 1].BPM; // Get the latest BPM value
  
          // Check if the latest BPM is different from the last one in the state
          setAllData(prevData => {
            const lastBPM = prevData[timeUnit].data[prevData[timeUnit].data.length - 1]; // Last BPM value in current state
  
            // If the latest data is the same as the last one, skip the update
            if (latestBPM === lastBPM) {
              console.log('No new BPM data, skipping update.');
              return prevData; // Return the previous data to prevent update
            }
  
            // If new data is different, update the chart
            const now = new Date();
            const time = timeUnit === 'seconds'
              ? `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
              : timeUnit === 'minutes'
              ? `${now.getHours()}:${now.getMinutes()}`
              : `${now.getHours()}`;
    
            const newLabels = [...prevData[timeUnit].labels, time];
            const newData = [...prevData[timeUnit].data, latestBPM]; // Get the latest BPM value
    
            const totalBeats = newData.reduce((acc, val) => acc + val, 0);
            const avgBeats = totalBeats / newData.length;
    
            setAvgBeats(avgBeats.toFixed(2));
    
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
              ...prevData,
              [timeUnit]: {
                labels: newLabels,
                data: newData,
              },
            };
          });
        } else {
          console.warn('No valid data received from the API');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    const intervalDuration = timeUnit === 'seconds' ? 1000 : timeUnit === 'minutes' ? 60000 : 3600000;
    const interval = setInterval(fetchData, intervalDuration);
  
    return () => clearInterval(interval);
  }, [isSliderAtEnd, visibleRange, timeUnit, chartData.datasets]);
  

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setVisibleRange([value, value + 10]);
    setIsSliderAtEnd(value + 10 >= chartData.labels.length);
  };

  const handleTimeUnitChange = (event) => {
    const newTimeUnit = event.target.value;
    setTimeUnit(newTimeUnit);
    dispatch({
      type: 'UPDATE_CHART',
      payload: {
        labels: allData[newTimeUnit].labels,
        data: allData[newTimeUnit].data,
      },
    });
    setVisibleRange([0, 10]);
    setIsSliderAtEnd(true);
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
        text: 'Beats per Minute Over Time',
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
          text: 'Beats per Minute',
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
        max: 200,
      },
    },
  };

  return (
    <div style={{ width: '700px', height: '600px', marginTop: '50px' }}>
      <Line data={chartData} options={options} />
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <label>
          Time Unit:
          <select value={timeUnit} onChange={handleTimeUnitChange} style={{ marginLeft: '10px' }}>
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </label>
        <input
          type="range"
          min="0"
          max={Math.max(0, chartData.labels.length - 10)}
          value={visibleRange[0]}
          onChange={handleSliderChange}
          style={{ width: '100%', marginTop: '10px' }}
        />
      </div>
      <p>Avg Beats per Minute: {avgBeats}</p>
    </div>
  );
};

export default BeatsChart;