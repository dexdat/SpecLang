# speclang-header lines:5
# id: @specs/ui-dashboard
# version: 1.0.0
# layer: 5

/**
 * CascadeIndicator component showing current cascade state
 * Generated from: @implementation/ui-dashboard
 */

import React from 'react';

interface CascadeIndicatorProps {
  status?: 'idle' | 'running' | 'converged' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-500',
  running: 'bg-green-500 animate-pulse',
  converged: 'bg-blue-500',
  error: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  idle: 'Idle',
  running: 'Running',
  converged: 'Converged',
  error: 'Error',
};

export const CascadeIndicator: React.FC<CascadeIndicatorProps> = ({
  status = 'idle',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-full ${sizeClasses[size]} ${statusColors[status]}`}
        title={`Cascade Status: ${statusLabels[status]}`}
      />
      <span className="text-sm text-gray-400">{statusLabels[status]}</span>
    </div>
  );
};

export default CascadeIndicator;
