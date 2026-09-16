// src/App.js
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Stats from './components/Stats';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { ThemeProvider } from './hooks/useTheme';
import './styles/App.css';

function App() {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <ThemeProvider>
      <div className="App">
        <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
        <Hero />
        <Features />
        <Stats />
        <Testimonials />
        <Newsletter />
        <Contact />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;