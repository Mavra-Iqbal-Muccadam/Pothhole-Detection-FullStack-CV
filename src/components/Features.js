// src/components/Features.js
import React from 'react';

const Features = () => {
  const features = [
    {
      title: 'Centralised Issue Registry',
      description: 'Consolidated dashboard for all reported cracks, potholes, and surface failures across districts.'
    },
    {
      title: 'Location-Aware Reporting',
      description: 'Each photo or video is linked with location metadata to help departments plan site visits and tenders.'
    },
    {
      title: 'Priority & Severity Scoring',
      description: 'Automatic severity levels (low, medium, high) to support maintenance scheduling and emergency responses.'
    },
    {
      title: 'Policy & Planning Support',
      description: 'Aggregated indicators for budget proposals, PC-1 preparation, and performance monitoring of road projects.'
    }
  ];

  return (
    <section className="features" id="features">
      <h2>Key Government Capabilities</h2>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <div key={index} className="card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;