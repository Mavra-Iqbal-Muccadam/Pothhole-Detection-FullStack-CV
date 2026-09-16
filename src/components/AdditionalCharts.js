// src/components/AdditionalCharts.js
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const AdditionalCharts = () => {
  const severityChartRef = useRef(null);
  const roadTypeChartRef = useRef(null);
  const severityChartInstance = useRef(null);
  const roadTypeChartInstance = useRef(null);

  useEffect(() => {
    initializeSeverityChart();
    initializeRoadTypeChart();

    return () => {
      // Clean up chart instances
      if (severityChartInstance.current) {
        severityChartInstance.current.destroy();
      }
      if (roadTypeChartInstance.current) {
        roadTypeChartInstance.current.destroy();
      }
    };
  }, []);

  const initializeSeverityChart = () => {
    const ctx = severityChartRef.current.getContext('2d');
    
    severityChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Minor', 'Moderate', 'Severe', 'Critical'],
        datasets: [{
          data: [45, 30, 15, 10],
          backgroundColor: [
            'rgba(76, 175, 80, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(255, 152, 0, 0.8)',
            'rgba(244, 67, 54, 0.8)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(244, 67, 54, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'var(--text-color)',
              font: {
                size: 12
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  };

  const initializeRoadTypeChart = () => {
    const ctx = roadTypeChartRef.current.getContext('2d');
    
    roadTypeChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Highways', 'City Roads', 'Rural Roads', 'Residential'],
        datasets: [{
          data: [35, 25, 20, 20],
          backgroundColor: [
            'rgba(33, 150, 243, 0.8)',
            'rgba(156, 39, 176, 0.8)',
            'rgba(0, 150, 136, 0.8)',
            'rgba(121, 85, 72, 0.8)'
          ],
          borderColor: [
            'rgba(33, 150, 243, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(0, 150, 136, 1)',
            'rgba(121, 85, 72, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'var(--text-color)',
              font: {
                size: 12
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  };

  return (
    <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginTop: '50px' }}>
      <div className="chart-container">
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-color)' }}>Damage Severity Distribution</h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <canvas ref={severityChartRef}></canvas>
        </div>
      </div>
      
      <div className="chart-container">
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-color)' }}>Road Types Analysis</h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <canvas ref={roadTypeChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default AdditionalCharts;