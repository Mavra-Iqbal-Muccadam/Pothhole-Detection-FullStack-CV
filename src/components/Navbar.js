// src/components/Navbar.js
import React, { useState, useEffect } from 'react';

const Navbar = ({ activeSection, setActiveSection }) => {
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'features', label: 'Government Tools' },
    { id: 'upload', label: 'Report Road Issue' },
    { id: 'stats', label: 'National Insights' },
    { id: 'testimonials', label: 'Field Feedback' },
    { id: 'contact', label: 'Govt Contact' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="logo">National Road Condition Portal</div>
      <ul>
        {navItems.map(item => (
          <li key={item.id}>
            <a 
              href={`#${item.id}`}
              className={activeSection === item.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;