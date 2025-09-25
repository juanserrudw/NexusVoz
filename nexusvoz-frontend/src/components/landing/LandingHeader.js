import React, { useState, useEffect } from 'react';

const LandingHeader = ({ onLogin, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'glass-effect bg-opacity-95' : 'glass-effect'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* Logo Red Neural - Tamaño Header MÁS GRANDE */}
            <div className="flex items-center space-x-3">
              <svg width="90" height="70" viewBox="0 0 140 90">
                <defs>
                  <linearGradient id="neuralHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
                    <stop offset="50%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                  </linearGradient>
                  <filter id="glowHeader">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <g transform="translate(25, 45)">
                  {/* Primera capa de nodos - MÁS GRANDE */}
                  <circle cx="0" cy="-20" r="4" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  <circle cx="0" cy="0" r="5" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  <circle cx="0" cy="20" r="4" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  
                  {/* Segunda capa de nodos - MÁS GRANDE */}
                  <circle cx="35" cy="-15" r="5" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  <circle cx="35" cy="0" r="6" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  <circle cx="35" cy="15" r="5" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  
                  {/* Tercera capa de nodos - MÁS GRANDE */}
                  <circle cx="70" cy="-10" r="5" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  <circle cx="70" cy="10" r="5" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  
                  {/* Cuarta capa (salida) - MÁS GRANDE */}
                  <circle cx="90" cy="0" r="6" fill="url(#neuralHeader)" filter="url(#glowHeader)"/>
                  
                  {/* Conexiones neurales - MÁS VISIBLES */}
                  <line x1="0" y1="-20" x2="35" y2="-15" stroke="url(#neuralHeader)" strokeWidth="2" opacity="0.6"/>
                  <line x1="0" y1="-20" x2="35" y2="0" stroke="url(#neuralHeader)" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="0" y1="-20" x2="35" y2="15" stroke="url(#neuralHeader)" strokeWidth="1" opacity="0.3"/>
                  
                  <line x1="0" y1="0" x2="35" y2="-15" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.8"/>
                  <line x1="0" y1="0" x2="35" y2="0" stroke="url(#neuralHeader)" strokeWidth="3" opacity="1"/>
                  <line x1="0" y1="0" x2="35" y2="15" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.8"/>
                  
                  <line x1="0" y1="20" x2="35" y2="-15" stroke="url(#neuralHeader)" strokeWidth="1" opacity="0.3"/>
                  <line x1="0" y1="20" x2="35" y2="0" stroke="url(#neuralHeader)" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="0" y1="20" x2="35" y2="15" stroke="url(#neuralHeader)" strokeWidth="2" opacity="0.6"/>
                  
                  <line x1="35" y1="-15" x2="70" y2="-10" stroke="url(#neuralHeader)" strokeWidth="2" opacity="0.7"/>
                  <line x1="35" y1="-15" x2="70" y2="10" stroke="url(#neuralHeader)" strokeWidth="1.5" opacity="0.5"/>
                  <line x1="35" y1="0" x2="70" y2="-10" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.9"/>
                  <line x1="35" y1="0" x2="70" y2="10" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.9"/>
                  <line x1="35" y1="15" x2="70" y2="-10" stroke="url(#neuralHeader)" strokeWidth="1.5" opacity="0.5"/>
                  <line x1="35" y1="15" x2="70" y2="10" stroke="url(#neuralHeader)" strokeWidth="2" opacity="0.7"/>
                  
                  <line x1="70" y1="-10" x2="90" y2="0" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.8"/>
                  <line x1="70" y1="10" x2="90" y2="0" stroke="url(#neuralHeader)" strokeWidth="2.5" opacity="0.8"/>
                </g>
              </svg>
              <span className="text-xl font-bold text-white">JCDevelopment Technologies</span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#inicio" className="hover:text-blue-400 transition-colors text-white">Inicio</a>
            <a href="#nosotros" className="hover:text-blue-400 transition-colors text-white">Nosotros</a>
            <a href="#servicios" className="hover:text-blue-400 transition-colors text-white">Servicios</a>
            <a href="#contacto" className="hover:text-blue-400 transition-colors text-white">Contacto</a>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={onLogin}
              className="px-4 py-2 text-blue-400 border border-blue-400 rounded-lg hover:bg-blue-400 hover:text-white transition-all"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={onRegister}
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