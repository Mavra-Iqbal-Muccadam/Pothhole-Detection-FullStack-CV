// src/components/Testimonials.js
import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      text: "Since adopting the National Road Condition Portal, our district office receives structured reports instead of scattered complaints. It has transformed how we track damaged roads and respond to citizens.",
      author: "Engr. Ahmed Khan",
      position: "Executive Engineer (Highways)",
      initials: "AK"
    },
    {
      text: "Field staff now upload photos directly from site visits. The severity indicators help us decide which stretches to include in our quarterly maintenance plan.",
      author: "Sara Malik",
      position: "Assistant Director, Roads & Infrastructure",
      initials: "SM"
    },
    {
      text: "For the provincial transport department, the dashboard provides a clear picture of which tehsils need urgent attention. It has improved coordination with contractors and budget allocation.",
      author: "Muhammad Ali",
      position: "Deputy Secretary, Transport Department",
      initials: "MA"
    }
  ];

  return (
    <section className="testimonials" id="testimonials">
      <h2>Voices from the Field</h2>
      <p>Feedback from government officers and engineers using the portal in daily operations.</p>
      
      <div className="testimonial-grid">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-card">
            <div className="testimonial-text">
              {testimonial.text}
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">{testimonial.initials}</div>
              <div className="author-info">
                <h4>{testimonial.author}</h4>
                <p>{testimonial.position}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;