import React from 'react';
import { createRoot } from 'react-dom/client';
import { SystemDashboard } from '@/components/SystemDashboard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SystemDashboard />
  </React.StrictMode>
);