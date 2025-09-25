import React from 'react';

const HeroSection = ({ onGoToNexusVoz }) => {
  return (
    <section id="inicio" className="min-h-screen flex items-center justify-center gradient-bg tech-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-500 rounded-full opacity-20 floating"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500 rounded-full opacity-20 floating-delayed"></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 bg-indigo-500 rounded-full opacity-20 floating"></div>
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
        <div className="mb-8">
          {/* Logo Red Neural Principal - Tamaño Grande */}
          <div className="flex justify-center mb-8">
            <svg width="200" height="140" viewBox="0 0 240 180" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="neuralHero" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
                  <stop offset="33%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                  <stop offset="66%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#EC4899", stopOpacity:1}} />
                </linearGradient>
                <filter id="glowHero" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <g transform="translate(40, 90)">
                {/* Primera capa - Entrada */}
                <circle cx="0" cy="-40" r="6" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="0" cy="-20" r="8" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="0" cy="0" r="10" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="0" cy="20" r="8" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="0" cy="40" r="6" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                
                {/* Segunda capa - Oculta 1 */}
                <circle cx="60" cy="-30" r="7" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="60" cy="-10" r="9" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="60" cy="10" r="9" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="60" cy="30" r="7" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                
                {/* Tercera capa - Oculta 2 */}
                <circle cx="120" cy="-20" r="8" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="120" cy="0" r="10" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                <circle cx="120" cy="20" r="8" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                
                {/* Cuarta capa - Salida */}
                <circle cx="160" cy="0" r="12" fill="url(#neuralHero)" filter="url(#glowHero)"/>
                
                {/* Conexiones Neurales - Capa 1 a 2 */}
                <line x1="0" y1="-40" x2="60" y2="-30" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.5"/>
                <line x1="0" y1="-40" x2="60" y2="-10" stroke="url(#neuralHero)" strokeWidth="1.5" opacity="0.4"/>
                <line x1="0" y1="-20" x2="60" y2="-30" stroke="url(#neuralHero)" strokeWidth="3" opacity="0.7"/>
                <line x1="0" y1="-20" x2="60" y2="-10" stroke="url(#neuralHero)" strokeWidth="3.5" opacity="0.9"/>
                <line x1="0" y1="-20" x2="60" y2="10" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.6"/>
                <line x1="0" y1="0" x2="60" y2="-30" stroke="url(#neuralHero)" strokeWidth="2.5" opacity="0.6"/>
                <line x1="0" y1="0" x2="60" y2="-10" stroke="url(#neuralHero)" strokeWidth="4" opacity="1"/>
                <line x1="0" y1="0" x2="60" y2="10" stroke="url(#neuralHero)" strokeWidth="4" opacity="1"/>
                <line x1="0" y1="0" x2="60" y2="30" stroke="url(#neuralHero)" strokeWidth="2.5" opacity="0.6"/>
                <line x1="0" y1="20" x2="60" y2="-10" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.6"/>
                <line x1="0" y1="20" x2="60" y2="10" stroke="url(#neuralHero)" strokeWidth="3.5" opacity="0.9"/>
                <line x1="0" y1="20" x2="60" y2="30" stroke="url(#neuralHero)" strokeWidth="3" opacity="0.7"/>
                <line x1="0" y1="40" x2="60" y2="10" stroke="url(#neuralHero)" strokeWidth="1.5" opacity="0.4"/>
                <line x1="0" y1="40" x2="60" y2="30" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.5"/>
                
                {/* Conexiones Neurales - Capa 2 a 3 */}
                <line x1="60" y1="-30" x2="120" y2="-20" stroke="url(#neuralHero)" strokeWidth="2.5" opacity="0.7"/>
                <line x1="60" y1="-30" x2="120" y2="0" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.5"/>
                <line x1="60" y1="-10" x2="120" y2="-20" stroke="url(#neuralHero)" strokeWidth="3.5" opacity="0.9"/>
                <line x1="60" y1="-10" x2="120" y2="0" stroke="url(#neuralHero)" strokeWidth="4" opacity="1"/>
                <line x1="60" y1="-10" x2="120" y2="20" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.6"/>
                <line x1="60" y1="10" x2="120" y2="-20" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.6"/>
                <line x1="60" y1="10" x2="120" y2="0" stroke="url(#neuralHero)" strokeWidth="4" opacity="1"/>
                <line x1="60" y1="10" x2="120" y2="20" stroke="url(#neuralHero)" strokeWidth="3.5" opacity="0.9"/>
                <line x1="60" y1="30" x2="120" y2="0" stroke="url(#neuralHero)" strokeWidth="2" opacity="0.5"/>
                <line x1="60" y1="30" x2="120" y2="20" stroke="url(#neuralHero)" strokeWidth="2.5" opacity="0.7"/>
                
                {/* Conexiones Neurales - Capa 3 a 4 */}
                <line x1="120" y1="-20" x2="160" y2="0" stroke="url(#neuralHero)" strokeWidth="3" opacity="0.8"/>
                <line x1="120" y1="0" x2="160" y2="0" stroke="url(#neuralHero)" strokeWidth="4" opacity="1"/>
                <line x1="120" y1="20" x2="160" y2="0" stroke="url(#neuralHero)" strokeWidth="3" opacity="0.8"/>
              </g>
            </svg>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          JCDevelopment Technologies
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Transformamos tu negocio con soluciones de <span className="text-blue-400 font-semibold">Inteligencia Artificial</span> innovadoras. 
          Descubre el futuro de la comunicación empresarial con <span className="text-purple-400 font-semibold">NexusVoz</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={onGoToNexusVoz}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Descubre NexusVoz
          </button>
          <button 
            onClick={() => {
              document.getElementById('nosotros').scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
            className="px-8 py-4 glass-effect rounded-full text-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-all"
          >
            Ver Más Información
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;