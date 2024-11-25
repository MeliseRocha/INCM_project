import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const SensorChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Saturation',
        data: [],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
    ],
  });

  const [avgSaturation, setAvgSaturation] = useState(0);
  const [visibleRange, setVisibleRange] = useState([0, 10]);
  const [isSliderAtEnd, setIsSliderAtEnd] = useState(true);
  const [timeUnit, setTimeUnit] = useState('seconds');
  const [allData, setAllData] = useState({
    seconds: { labels: [], data: [] },
    minutes: { labels: [], data: [] },
    hours: { labels: [], data: [] },
  });

  useEffect(() => {
    const intervalDuration = timeUnit === 'seconds' ? 1000 : timeUnit === 'minutes' ? 60000 : 3600000; // 1 second, 1 minute, or 1 hour
    const interval = setInterval(() => {
      const now = new Date();
      const time = timeUnit === 'seconds'
        ? `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
        : timeUnit === 'minutes'
        ? `${now.getHours()}:${now.getMinutes()}`
        : `${now.getHours()}`;

      const saturation = Math.floor(Math.random() * 100); // Simulate saturation data

      setAllData(prevData => {
        const newLabels = [...prevData[timeUnit].labels, time];
        const newData = [...prevData[timeUnit].data, saturation];

        const totalSaturation = newData.reduce((acc, val) => acc + val, 0);
        const avgSaturation = totalSaturation / newData.length;

        setAvgSaturation(avgSaturation.toFixed(2));

        const newVisibleRange = isSliderAtEnd
          ? [Math.max(0, newLabels.length - 10), newLabels.length]
          : visibleRange;

        setVisibleRange(newVisibleRange);

        setChartData({
          labels: newLabels,
          datasets: [
            {
              ...chartData.datasets[0],
              data: newData,
            },
          ],
        });

        return {
          ...prevData,
          [timeUnit]: {
            labels: newLabels,
            data: newData,
          },
        };
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [isSliderAtEnd, visibleRange, timeUnit]);

  const handleSliderChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setVisibleRange([value, value + 10]);
    setIsSliderAtEnd(value + 10 >= chartData.labels.length);
  };

  const handleTimeUnitChange = (event) => {
    const newTimeUnit = event.target.value;
    setTimeUnit(newTimeUnit);
    setChartData({
      labels: allData[newTimeUnit].labels,
      datasets: [
        {
          label: 'Saturation',
          data: allData[newTimeUnit].data,
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
        },
      ],
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
      <p>Avg Saturation: {avgSaturation}</p>
    </div>
  );
};

export default SensorChart;