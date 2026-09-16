// src/components/RoadVisualization.js
import React, { useState, useEffect } from 'react';
import './RoadVisualization.css';

const RoadVisualization = () => {
  const [cars, setCars] = useState([]);
  const [cracks, setCracks] = useState([]);
  const [potholes, setPotholes] = useState([]);

  // Initialize road elements
  useEffect(() => {
    // Initialize cars
    const initialCars = [
      { id: 1, lane: 1, color: '#E74C3C', speed: 6, position: -100, type: 'sedan' },
      { id: 2, lane: 2, color: '#3498DB', speed: 8, position: -200, type: 'suv' },
      { id: 3, lane: 3, color: '#2ECC71', speed: 10, position: -150, type: 'sports' },
      { id: 4, lane: 1, color: '#F39C12', speed: 5, position: -300, type: 'truck' },
      { id: 5, lane: 2, color: '#9B59B6', speed: 7, position: -250, type: 'compact' },
      { id: 6, lane: 3, color: '#1ABC9C', speed: 9, position: -350, type: 'sedan' }
    ];

    // Initialize cracks
    const initialCracks = [
      { id: 1, x: 15, y: 40, width: 120, rotation: 45, severity: 'high' },
      { id: 2, x: 35, y: 60, width: 80, rotation: -30, severity: 'medium' },
      { id: 3, x: 60, y: 35, width: 150, rotation: 15, severity: 'high' },
      { id: 4, x: 75, y: 70, width: 100, rotation: -15, severity: 'medium' },
      { id: 5, x: 45, y: 55, width: 90, rotation: 60, severity: 'low' },
      { id: 6, x: 25, y: 75, width: 130, rotation: -45, severity: 'high' },
      { id: 7, x: 65, y: 45, width: 110, rotation: 30, severity: 'medium' },
      { id: 8, x: 55, y: 65, width: 70, rotation: -60, severity: 'low' }
    ];

    // Initialize potholes
    const initialPotholes = [
      { id: 1, x: 20, y: 50, size: 35, severity: 'high' },
      { id: 2, x: 40, y: 35, size: 25, severity: 'medium' },
      { id: 3, x: 70, y: 60, size: 40, severity: 'high' },
      { id: 4, x: 50, y: 70, size: 30, severity: 'medium' },
      { id: 5, x: 30, y: 45, size: 20, severity: 'low' },
      { id: 6, x: 60, y: 55, size: 28, severity: 'medium' }
    ];

    setCars(initialCars);
    setCracks(initialCracks);
    setPotholes(initialPotholes);
  }, []);

  // Animate cars
  useEffect(() => {
    const interval = setInterval(() => {
      setCars(prevCars => 
        prevCars.map(car => ({
          ...car,
          position: car.position > 120 ? -100 : car.position + car.speed * 0.1
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Get car position based on lane
  const getCarPosition = (car) => {
    const lanePositions = {
      1: '35%', // Left lane
      2: '50%', // Center lane
      3: '65%'  // Right lane
    };
    
    return {
      left: `${car.position}%`,
      top: lanePositions[car.lane],
      backgroundColor: car.color
    };
  };

  // Get crack style
  const getCrackStyle = (crack) => ({
    left: `${crack.x}%`,
    top: `${crack.y}%`,
    width: `${crack.width}px`,
    transform: `rotate(${crack.rotation}deg)`,
    opacity: crack.severity === 'high' ? 0.9 : crack.severity === 'medium' ? 0.7 : 0.5
  });

  // Get pothole style
  const getPotholeStyle = (pothole) => ({
    left: `${pothole.x}%`,
    top: `${pothole.y}%`,
    width: `${pothole.size}px`,
    height: `${pothole.size}px`,
    opacity: pothole.severity === 'high' ? 1 : pothole.severity === 'medium' ? 0.8 : 0.6
  });

  return (
    <div className="road-visualization-container">
      <div className="road-scene">
        {/* Environment */}
        <div className="environment">
          <div className="horizon"></div>
        </div>

        {/* Road Shoulders */}
        <div className="road-shoulders">
          <div className="shoulder left"></div>
          <div className="shoulder right"></div>
        </div>

        {/* Road Surface */}
        <div className="road-surface">
          <div className="road-texture"></div>
        </div>

        {/* Lane Markings */}
        <div className="lane-markings">
          <div className="side-line left"></div>
          <div className="side-line right"></div>
        </div>

        {/* Center Yellow Dashed Line */}
        <div className="center-line"></div>

        {/* Road Cracks */}
        <div className="road-cracks">
          {cracks.map(crack => (
            <div
              key={crack.id}
              className="crack"
              style={getCrackStyle(crack)}
            />
          ))}
        </div>

        {/* Potholes */}
        <div className="potholes-container">
          {potholes.map(pothole => (
            <div
              key={pothole.id}
              className="pothole"
              style={getPotholeStyle(pothole)}
            >
              <div className="pothole-inner"></div>
              <div className="pothole-cracks"></div>
            </div>
          ))}
        </div>

        {/* Moving Cars */}
        <div className="cars-container">
          {cars.map(car => (
            <div
              key={car.id}
              className="car"
              style={getCarPosition(car)}
            >
              <div className="car-body">
                <div className="car-top"></div>
                <div className="car-windows">
                  <div className="car-window left-window"></div>
                  <div className="car-window right-window"></div>
                </div>
                <div className="car-lights car-headlight"></div>
                <div className="car-lights car-taillight"></div>
                <div className="car-wheels">
                  <div className="wheel front-wheel"></div>
                  <div className="wheel rear-wheel"></div>
                </div>
              </div>
              <div className="car-shadow"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Road Statistics */}
      <div className="road-stats">
        <div className="stat-item">
          <span>Simulated Traffic Flow:</span>
          <span className="stat-value">{cars.length}</span>
        </div>
        <div className="stat-item">
          <span>Crack Indicators:</span>
          <span className="stat-value">{cracks.length}</span>
        </div>
        <div className="stat-item">
          <span>Pothole Indicators:</span>
          <span className="stat-value">{potholes.length}</span>
        </div>
        <div className="stat-item">
          <span>Overall Condition Status:</span>
          <span className="stat-value">Under Monitoring</span>
        </div>
      </div>
    </div>
  );
};

export default RoadVisualization;