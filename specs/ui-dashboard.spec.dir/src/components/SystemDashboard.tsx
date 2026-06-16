import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { useCascadeStatus, useAgentStatus, useFileWatcherStatus } from '../hooks/useCascadeStatus';

export const SystemDashboard: React.FC = () => {
  const { cascadeState, queueDepth, convergenceTimer } = useCascadeStatus();
  const { agents } = useAgentStatus();
  const fileWatcher = useFileWatcherStatus();
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');

  const handleUserControlsClick = () => {
    // TODO: Implement user controls modal
    console.log('User controls clicked');
  };

  const handleSidebarItemClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
  };

  return (
    <div className="grid grid-cols-[256px_1fr] grid-rows-[64px_1fr] min-h-screen bg-black text-white">
      <DashboardHeader
        queueDepth={queueDepth}
        convergenceTime={convergenceTimer}
        onUserControlsClick={handleUserControlsClick}
      />
      <Sidebar
        activeItem={activeSidebarItem}
        onItemClick={handleSidebarItemClick}
      />
      <MainContent
        cascadeState={cascadeState}
        agents={agents}
        fileWatcher={fileWatcher}
        activeView={activeSidebarItem}
      />
    </div>
  );
};

export default SystemDashboard;
