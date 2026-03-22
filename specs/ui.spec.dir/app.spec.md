# speclang-header lines:13
id: "@speclang/ui.app"
parent: "@ref:specs/ui"
part: 15/15
siblings:
  prev: "@ref:specs/ui.spec.dir/index"
short: Dashboard React app entry point
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
target: src/dashboard/app.tsx
---

# Dashboard App.tsx

Main React application entry point for the system monitoring dashboard.

## Component

```speclang
# @block:dashboard/app-tsx @kind:code
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SystemDashboard } from '../ui-dashboard/components/SystemDashboard';
import './styles/tailwind.css';
import './styles/brutalist.css';

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
```