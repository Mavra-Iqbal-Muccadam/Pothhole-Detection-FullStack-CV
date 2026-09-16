// src/components/Hero.js
import React from 'react';

const Hero = () => {
  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <section className="container" id="home">
      <h1>Government Road Condition Monitoring Portal</h1>
      <p>
        A national platform for provincial and federal authorities to receive, analyse, and
        prioritise reports of cracks, potholes, and road damage from the field and citizens.
      </p>
      <button className="btn" onClick={goToLogin}>Report Road Issue</button>
      
      <div className="mission-statement">
        <h3>National Road Condition Portal</h3>
        <div className="tagline">Driving Pakistan Towards Better Infrastructure</div>
        <p>
          A comprehensive government initiative leveraging advanced technology 
          to monitor, maintain, and improve road infrastructure across Pakistan. 
          We ensure safer, more efficient transportation networks through 
          real-time data analysis and proactive maintenance strategies.
        </p>
      </div>

      {/* Media Showcase */}
      <div className="hero-media-grid">
        {/* Top left - video1 */}
        <div className="hero-media-card hero-media-video-large">
          <video
            src="video1.mp4"
            autoPlay
            loop
            muted
          />
        </div>

        {/* Top right - video2 */}
        <div className="hero-media-card hero-media-video-small">
          <video
            src="video2.mp4"
            autoPlay
            loop
            muted
          />
        </div>

        {/* Bottom left - imag1 (reduced height) */}
        <div className="hero-media-card hero-media-image-large">
          <img
            src="imag1.jpg"
            alt="Road infrastructure"
          />
        </div>

        {/* Bottom right - img2 (reduced height) */}
        <div className="hero-media-card hero-media-image-small">
          <img
            src="img2.jpg"
            alt="Road maintenance"
          />
        </div>

        {/* Bottom right - img2 (reduced height) */}
        <div className="hero-media-card hero-media-image-small">
          <img
            src="img3.jpg"
            alt="Road maintenance"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;