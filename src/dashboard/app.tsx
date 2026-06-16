import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => <div>Hello Dashboard</div>;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
