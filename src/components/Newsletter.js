// src/components/Newsletter.js
import React, { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert('Thank you for subscribing to our newsletter!');
    setEmail('');
  };

  return (
    <section className="newsletter">
      <h2>Get Government Road Updates</h2>
      <p>Subscribe to receive circulars, policy updates, and analytical reports on national road conditions.</p>
      
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="newsletter-input"
          placeholder="Official email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="newsletter-btn">Subscribe</button>
      </form>
    </section>
  );
};

export default Newsletter;