import React from 'react';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import NexusVozSection from './NexusVozSection';
import ServicesSection from './ServicesSection';
import ContactSection from './ContactSection';
import LandingFooter from './LandingFooter';
import './LandingPage.css';

const LandingPage = ({ onGoToLogin, onGoToRegister }) => {
  const handleGoToNexusVoz = () => {
    onGoToLogin();
  };

  return (
    <div className="landing-page bg-gray-900 text-white overflow-x-hidden">
      <LandingHeader 
        onLogin={onGoToLogin}
        onRegister={onGoToRegister}
      />
      
      <HeroSection onGoToNexusVoz={handleGoToNexusVoz} />
      <AboutSection />
      <NexusVozSection onGoToNexusVoz={handleGoToNexusVoz} />
      <ServicesSection />
      <ContactSection onGoToNexusVoz={handleGoToNexusVoz} />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;