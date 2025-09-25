
import React from 'react';
import { RefreshCw } from 'lucide-react';

export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Cargando...', 
  showText = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {showText && (
        <span className={`${textSizeClasses[size]} text-gray-600`}>
          {text}
        </span>
      )}
    </div>
  );
};

export const FullPageLoader = ({ text = 'Cargando aplicación...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <RefreshCw className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">NexusVoz</h2>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
};