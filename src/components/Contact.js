// src/components/Contact.js
import React from 'react';

const Contact = () => {
  const contactInfo = [
    {
      title: 'Email',
      content: 'support@roadhealth.ai'
    },
    {
      title: 'Phone',
      content: '+92 345 9876879'
    },
    {
      title: 'Office Address',
      content: 'University Road, Software Department, Ground Floor'
    }
  ];

  return (
    <section id="contact">
      <h2>Government Contact</h2>
      <p>Reach out to our dedicated support team for assistance and inquiries</p>
      
      <div className="contact-grid">
        {contactInfo.map((info, index) => (
          <div key={index} className="contact-card">
            <h3>{info.title}</h3>
            <p>{info.content}</p>
          </div>
        ))}
      </div>

      <div className="contact-hours">
        <h4>Office Hours</h4>
        <p>Monday - Friday: 9:00 AM - 5:00 PM | Saturday: 9:00 AM - 1:00 PM</p>
      </div>
    </section>
  );
};

export default Contact;