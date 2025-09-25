
import React from 'react';
import { STATUS_COLORS, TYPE_COLORS } from '../../utils/constants';
import { formatStatus, formatAppointmentType } from '../../utils/formatters';

export const StatusBadge = ({ 
  status, 
  type = 'status', 
  className = '',
  size = 'sm' 
}) => {
  const colors = type === 'appointment_type' ? TYPE_COLORS : STATUS_COLORS;
  const colorClass = colors[status] || 'bg-gray-100 text-gray-800';
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const formatText = () => {
    switch (type) {
      case 'appointment_type':
        return formatAppointmentType(status);
      default:
        return formatStatus(status);
    }
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${colorClass} 
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      {formatText()}
    </span>
  );
};

export const InterestLevelBadge = ({ level, className = '' }) => {
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200'
  };

  const icons = {
    high: '🔥',
    medium: '⚡',
    low: '❄️'
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-2 py-1 text-xs font-medium 
        rounded-full border ${colors[level] || colors.low} ${className}
      `}
    >
      <span>{icons[level]}</span>
      {formatStatus(level)} interés
    </span>
  );
};