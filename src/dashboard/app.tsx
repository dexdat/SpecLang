import React from 'react';
import { createRoot } from 'react-dom/client';
import { SpecList, CascadeStatus, HealthGauge, LayerChart } from './components';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './handlers/keyboard-shortcuts';
import './styles/main.css';

const App = () => {
  const dashboard = useDashboardState();
  const { theme, toggleTheme } = useTheme();

  useKeyboardShortcuts({
    refreshDashboard: () => dashboard.refreshHealth(),
    triggerCascade: () => dashboard.triggerCascade(),
    pauseCascade: () => dashboard.pauseCascade(),
    abortCascade: () => dashboard.abortCascade(),
    finalizeCascade: () => dashboard.finalizeCascade(),
  });

  const implRatio = dashboard.health
    ? `${Math.round((dashboard.health.withImplementation / Math.max(dashboard.health.totalSpecs, 1)) * 100)}%`
    : '—';

  return (
    <div className="min-h-screen grid-background" style={{ fontFamily: 'var(--font-body)' }}>
      <header className="flex justify-between items-center" style={{
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: 'var(--border-width) solid var(--color-primary)',
      }}>
        <h1 className="text-h2" style={{ fontFamily: 'var(--font-display)' }}>
          SpecLang Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {dashboard.lastRefresh && (
            <span className="text-tiny text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              {dashboard.lastRefresh.toLocaleTimeString()}
            </span>
          )}
          {dashboard.isLoading && (
            <span className="text-tiny text-muted" style={{ fontFamily: 'var(--font-mono)' }}>syncing...</span>
          )}
          <button className="button" onClick={() => dashboard.refreshHealth()} title="Refresh (F5)">
            ↻ Refresh
          </button>
          <button className="button" onClick={toggleTheme} title="Toggle theme">
            {theme === 'brutalist-dark' ? '☀' : theme === 'brutalist-light' ? '◉' : '◐'}
          </button>
        </div>
      </header>

      <main style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <HealthGauge
            totalSpecs={dashboard.health?.totalSpecs ?? 0}
            withHeader={dashboard.health?.withHeader ?? 0}
            withImplementation={dashboard.health?.withImplementation ?? 0}
            implRatio={implRatio}
            metrics={dashboard.health?.metrics}
          />
          <LayerChart byLayer={dashboard.health?.byLayer ?? {}} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <CascadeStatus
            status={dashboard.cascadeStatus}
            depth={dashboard.cascadeDepth}
            maxDepth={10}
            currentFile={dashboard.cascadeCurrentFile}
            onTrigger={dashboard.triggerCascade}
            onPause={
              dashboard.cascadeStatus === 'running' ? dashboard.pauseCascade :
              dashboard.cascadeStatus === 'paused' ? dashboard.resumeCascade : undefined
            }
            onAbort={dashboard.abortCascade}
            onFinalize={dashboard.finalizeCascade}
          />
          <SpecList specs={dashboard.specs} />
        </div>
      </main>

      {dashboard.error && (
        <div className="toast-container">
          <div className="toast" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
            {dashboard.error}
          </div>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
