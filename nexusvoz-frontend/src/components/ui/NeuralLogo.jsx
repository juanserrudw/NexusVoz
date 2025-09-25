import React from 'react';

const NeuralLogo = ({ 
  size = 'medium', 
  showText = true, 
  textSize = 'base',
  animated = false,
  className = '' 
}) => {
  // Configuración de tamaños
  const sizes = {
    small: { width: 32, height: 32, nodeRadius: 2, strokeWidth: 1, fontSize: 6 },
    medium: { width: 48, height: 48, nodeRadius: 3, strokeWidth: 1.5, fontSize: 8 },
    large: { width: 64, height: 64, nodeRadius: 4, strokeWidth: 2, fontSize: 10 },
    xlarge: { width: 80, height: 80, nodeRadius: 5, strokeWidth: 2.5, fontSize: 12 },
    hero: { width: 128, height: 128, nodeRadius: 8, strokeWidth: 3, fontSize: 20 }
  };

  const config = sizes[size];

  // Configuración de texto
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm', 
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo SVG */}
      <svg 
        width={config.width} 
        height={config.height} 
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="drop-shadow-lg"
      >
        <defs>
          {/* Gradientes para la red neuronal */}
          <linearGradient id={`neural-primary-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
          </linearGradient>
          
          <linearGradient id={`neural-secondary-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#10B981", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#06B6D4", stopOpacity:1}} />
          </linearGradient>
          
          <linearGradient id={`neural-accent-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#EC4899", stopOpacity:1}} />
          </linearGradient>

          {/* Filtro de brillo */}
          <filter id={`neural-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Red Neural */}
        <g transform={`translate(${config.width/2}, ${config.height/2})`}>
          {/* Conexiones (líneas) */}
          <g stroke={`url(#neural-primary-${size})`} strokeWidth={config.strokeWidth} fill="none">
            {/* Primera capa a segunda capa */}
            <line x1={-config.width*0.25} y1={-config.height*0.15} x2={0} y2={-config.height*0.1} 
                  opacity="0.6" className={animated ? "connection-line" : ""} 
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={-config.height*0.15} x2={0} y2={0} 
                  opacity="0.4" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={0} x2={0} y2={-config.height*0.1} 
                  opacity="0.8" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={0} x2={0} y2={0} 
                  opacity="1" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={0} x2={0} y2={config.height*0.1} 
                  opacity="0.8" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={config.height*0.15} x2={0} y2={0} 
                  opacity="0.4" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={-config.width*0.25} y1={config.height*0.15} x2={0} y2={config.height*0.1} 
                  opacity="0.6" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            
            {/* Segunda capa a tercera capa */}
            <line x1={0} y1={-config.height*0.1} x2={config.width*0.25} y2={-config.height*0.08} 
                  opacity="0.7" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={0} y1={0} x2={config.width*0.25} y2={-config.height*0.08} 
                  opacity="0.9" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={0} y1={0} x2={config.width*0.25} y2={config.height*0.08} 
                  opacity="0.9" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
            <line x1={0} y1={config.height*0.1} x2={config.width*0.25} y2={config.height*0.08} 
                  opacity="0.7" className={animated ? "connection-line" : ""}
                  strokeDasharray={animated ? "2,2" : "none"}/>
          </g>
          
          {/* Nodos de la primera capa */}
          <circle cx={-config.width*0.25} cy={-config.height*0.15} r={config.nodeRadius} 
                  fill={`url(#neural-primary-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse" : ""}/>
          <circle cx={-config.width*0.25} cy={0} r={config.nodeRadius*1.2} 
                  fill={`url(#neural-secondary-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse-delayed" : ""}/>
          <circle cx={-config.width*0.25} cy={config.height*0.15} r={config.nodeRadius} 
                  fill={`url(#neural-accent-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse" : ""}/>
          
          {/* Nodos de la segunda capa */}
          <circle cx={0} cy={-config.height*0.1} r={config.nodeRadius*1.1} 
                  fill={`url(#neural-secondary-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse-delayed" : ""}/>
          <circle cx={0} cy={0} r={config.nodeRadius*1.4} 
                  fill={`url(#neural-primary-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse" : ""}/>
          <circle cx={0} cy={config.height*0.1} r={config.nodeRadius*1.1} 
                  fill={`url(#neural-accent-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse-delayed" : ""}/>
          
          {/* Nodos de la tercera capa */}
          <circle cx={config.width*0.25} cy={-config.height*0.08} r={config.nodeRadius*1.2} 
                  fill={`url(#neural-accent-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse" : ""}/>
          <circle cx={config.width*0.25} cy={config.height*0.08} r={config.nodeRadius*1.2} 
                  fill={`url(#neural-primary-${size})`} 
                  filter={`url(#neural-glow-${size})`}
                  className={animated ? "neural-pulse-delayed" : ""}/>
          
          {/* Letras centrales JC */}
          <text x="0" y={config.fontSize*0.3} 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontFamily="Inter" 
                fontSize={config.fontSize} 
                fontWeight="900" 
                fill="white">
            JC
          </text>
        </g>
      </svg>
      
      {/* Texto del logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizes[textSize]}`}>
            JCDevelopment
          </span>
          {size !== 'small' && (
            <span className={`text-gray-400 ${textSizes[textSize === 'xs' ? 'xs' : 'xs']} tracking-wider`}>
              TECHNOLOGIES
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NeuralLogo;