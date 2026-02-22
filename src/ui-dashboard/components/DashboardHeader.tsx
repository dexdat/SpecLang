/**
 * DashboardHeader component
 * Generated from: @implementation/ui-dashboard
 */

import React from 'react';
import { CascadeIndicator } from './CascadeIndicator';

interface DashboardHeaderProps {
  queueDepth?: number;
  convergenceTime?: number;
  onUserControlsClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  queueDepth = 0,
  convergenceTime = 0,
  onUserControlsClick,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 grid-texture">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-mono">SpecLang System Dashboard</h1>
          <CascadeIndicator />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Queue depth: <span className="text-green-400">{queueDepth}</span>
          </span>
          <span className="text-sm text-gray-400">
            Convergence: <span className="text-yellow-400">{convergenceTime}s</span>
          </span>
          <button
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
            onClick={onUserControlsClick}
          >
            User Controls
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
