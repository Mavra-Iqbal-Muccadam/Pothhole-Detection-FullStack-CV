// src/components/Footer.js
import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Footer = () => {
  const footerSections = [
    {
      title: 'National Road Condition Portal',
      content: 'A government initiative to monitor and maintain road conditions across Pakistan.',
      links: null,
      social: true
    },
    {
      title: 'Quick Links',
      links: ['Home', 'Road Conditions', 'Reports', 'Contact Us', 'FAQs']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'API Reference', 'Case Studies', 'Research Papers', 'Blog']
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Data Processing', 'Security']
    }
  ];

  const socialLinks = [
    { icon: 'fab fa-twitter', href: '#' },
    { icon: 'fab fa-facebook-f', href: '#' },
    { icon: 'fab fa-linkedin-in', href: '#' }
  ];

  return (
    <footer>
      <div className="footer-content">
        {footerSections.map((section, index) => (
          <div key={index} className="footer-column">
            <h3>{section.title}</h3>
            {section.content && <p>{section.content}</p>}
            {section.links && (
              <ul className="footer-links">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            )}
            {section.social && (
              <div className="social-links">
                {socialLinks.map((social, socialIndex) => (
                  <a key={socialIndex} href={social.href}>
                    <i className={social.icon}></i>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Government of Pakistan — National Road Condition Portal.</p>
      </div>
    </footer>
  );
};

export default Footer;