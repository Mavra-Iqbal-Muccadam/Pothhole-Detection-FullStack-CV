// src/components/Stats.js
import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const stats = [
    { id: 'roads-scanned', end: 12458, label: 'Kilometres of Road Assessed' },
    { id: 'cracks-detected', end: 8742, label: 'Reported Crack Segments' },
    { id: 'potholes-found', end: 3219, label: 'Registered Pothole Cases' },
    { id: 'cities-covered', end: 47, label: 'Districts Reporting Data' }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  // Initialize chart when component becomes visible
  useEffect(() => {
    if (isVisible && chartRef.current) {
      console.log('Initializing chart...');
      
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      // In your Stats.js component, update the chart options:
chartInstance.current = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [{
      label: 'New Issues Reported',
      data: [320, 450, 380, 520, 610, 730],
      backgroundColor: 'rgba(161, 195, 73, 0.8)',
      borderColor: 'rgba(161, 195, 73, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }, {
      label: 'Issues Resolved',
      data: [120, 180, 150, 210, 240, 290],
      backgroundColor: 'rgba(42, 60, 36, 0.8)',
      borderColor: 'rgba(42, 60, 36, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#CAD593',
          font: {
            size: 14,
            weight: '600'
          },
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(42, 60, 36, 0.95)',
        titleColor: '#CAD593',
        bodyColor: '#F5F7F0',
        borderColor: '#A1C349',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(202, 213, 147, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#CAD593',
          font: {
            size: 12,
            weight: '500'
          },
          padding: 10,
        },
        title: {
          display: true,
          text: 'Number of Issues',
          color: '#CAD593',
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(202, 213, 147, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#CAD593',
          font: {
            size: 12,
            weight: '500'
          },
          padding: 10,
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  }
});
      // Animate stats
      stats.forEach(stat => {
        animateValue(stat.id, 0, stat.end, 2000);
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [isVisible]);

  const animateValue = (id, start, end, duration) => {
    const obj = document.getElementById(id);
    if (!obj) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      obj.innerHTML = value.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  return (
    <section className="stats-section" id="stats" ref={statsRef}>
      <h2>National Road Condition Insights</h2>
      <p>Aggregated reports from provinces and districts to guide maintenance planning and funding.</p>
      
      <div className="stats-container">
        {stats.map(stat => (
          <div key={stat.id} className="stat-card">
            <div className="stat-number" id={stat.id}>0</div>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="chart-container">
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-color)' }}>
          Monthly Reported vs. Resolved Road Issues
        </h3>
        <div style={{ height: '400px', width: '100%' }}>
          <canvas 
            ref={chartRef} 
            style={{ 
              width: '100% !important', 
              height: '100% !important',
              display: 'block'
            }}
          ></canvas>
        </div>
      </div>
    </section>
  );
};

export default Stats;