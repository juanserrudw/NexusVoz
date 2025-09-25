import React from 'react';

const LandingFooter = () => {
  return (
    <footer className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {/* Logo Red Neural - Tamaño Footer MÁS GRANDE */}
              <svg width="60" height="45" viewBox="0 0 100 60">
                <defs>
                  <linearGradient id="neuralFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
                    <stop offset="50%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                  </linearGradient>
                  <filter id="glowFooter">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <g transform="translate(15, 30)">
                  {/* Nodos - MÁS GRANDES */}
                  <circle cx="0" cy="-12" r="3.5" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  <circle cx="0" cy="0" r="4" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  <circle cx="0" cy="12" r="3.5" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  
                  <circle cx="25" cy="-9" r="4" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  <circle cx="25" cy="0" r="4.5" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  <circle cx="25" cy="9" r="4" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  
                  <circle cx="50" cy="-6" r="4" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  <circle cx="50" cy="6" r="4" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  
                  <circle cx="70" cy="0" r="4.5" fill="url(#neuralFooter)" filter="url(#glowFooter)"/>
                  
                  {/* Conexiones - MÁS VISIBLES */}
                  <line x1="0" y1="-12" x2="25" y2="-9" stroke="url(#neuralFooter)" strokeWidth="1.5" opacity="0.6"/>
                  <line x1="0" y1="0" x2="25" y2="-9" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.8"/>
                  <line x1="0" y1="0" x2="25" y2="0" stroke="url(#neuralFooter)" strokeWidth="2.5" opacity="1"/>
                  <line x1="0" y1="0" x2="25" y2="9" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.8"/>
                  <line x1="0" y1="12" x2="25" y2="9" stroke="url(#neuralFooter)" strokeWidth="1.5" opacity="0.6"/>
                  
                  <line x1="25" y1="-9" x2="50" y2="-6" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.7"/>
                  <line x1="25" y1="0" x2="50" y2="-6" stroke="url(#neuralFooter)" strokeWidth="2.5" opacity="0.9"/>
                  <line x1="25" y1="0" x2="50" y2="6" stroke="url(#neuralFooter)" strokeWidth="2.5" opacity="0.9"/>
                  <line x1="25" y1="9" x2="50" y2="6" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.7"/>
                  
                  <line x1="50" y1="-6" x2="70" y2="0" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.8"/>
                  <line x1="50" y1="6" x2="70" y2="0" stroke="url(#neuralFooter)" strokeWidth="2" opacity="0.8"/>
                </g>
              </svg>
              <span className="text-lg font-bold text-white">JCDevelopment</span>
            </div>
            <p className="text-gray-400 text-sm">
              Transformando el futuro con IA
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Productos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">NexusVoz</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Chatbots IA</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Nosotros</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Soporte</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Documentación</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Ayuda</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          © 2024 JCDevelopment Technologies. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;