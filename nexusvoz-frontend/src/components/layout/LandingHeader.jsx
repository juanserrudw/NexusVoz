import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'glass-effect bg-opacity-95' : 'glass-effect'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">JC</span>
            </div>
            <span className="text-xl font-bold">JCDevelopment Technologies</span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#inicio" className="hover:text-blue-400 transition-colors">Inicio</a>
            <a href="#nosotros" className="hover:text-blue-400 transition-colors">Nosotros</a>
            <a href="#servicios" className="hover:text-blue-400 transition-colors">Servicios</a>
            <a href="#contacto" className="hover:text-blue-400 transition-colors">Contacto</a>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleLogin}
              className="px-4 py-2 text-blue-400 border border-blue-400 rounded-lg hover:bg-blue-400 hover:text-white transition-all"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={handleRegister}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg transition-all pulse-glow"
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingHeader;