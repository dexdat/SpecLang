import React from 'react';

type CascadeStatusType = 'idle' | 'running' | 'paused' | 'finalizing' | 'converged';

interface CascadeStatusProps {
  status: CascadeStatusType;
  depth?: number;
  maxDepth?: number;
  currentFile?: string | null;
  lastEventTime?: Date | null;
  onTrigger?: () => void;
  onPause?: () => void;
  onAbort?: () => void;
  onFinalize?: () => void;
}

const STATUS_CONFIG: Record<CascadeStatusType, { label: string; dotClass: string; color: string }> = {
  idle: { label: 'IDLE', dotClass: 'status-dot-idle', color: 'var(--color-status-idle)' },
  running: { label: 'RUNNING', dotClass: 'status-dot-running', color: 'var(--color-status-running)' },
  paused: { label: 'PAUSED', dotClass: 'status-dot-paused', color: 'var(--color-info)' },
  finalizing: { label: 'FINALIZING', dotClass: 'status-dot-finalizing', color: 'var(--color-status-active)' },
  converged: { label: 'CONVERGED', dotClass: 'status-dot-converged', color: 'var(--color-status-success)' },
};

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export const CascadeStatus: React.FC<CascadeStatusProps> = ({
  status,
  depth = 0,
  maxDepth = 10,
  currentFile = null,
  lastEventTime = null,
  onTrigger,
  onPause,
  onAbort,
  onFinalize,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const depthPct = maxDepth > 0 ? Math.min((depth / maxDepth) * 100, 100) : 0;
  const elapsed = lastEventTime ? Date.now() - lastEventTime.getTime() : 0;

  return (
    <div className="card">
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 className="text-h3">Cascade</h3>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${config.dotClass}`} />
          <span className="badge" style={{ color: config.color, borderColor: config.color }}>
            {config.label}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex justify-between" style={{ marginBottom: 'var(--space-1)' }}>
          <span className="metric-label">Depth</span>
          <span className="text-data text-small">{depth} / {maxDepth}</span>
        </div>
        <div className="bar-track">
          <div
            className="bar"
            style={{
              width: `${depthPct}%`,
              background: depthPct > 80 ? 'var(--color-status-error)' : config.color,
            }}
          />
        </div>
      </div>

      {currentFile && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <span className="metric-label">Current File</span>
          <div className="text-data text-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentFile}
          </div>
        </div>
      )}

      {lastEventTime && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <span className="metric-label">Last Event</span>
          <div className="text-data text-small text-muted">{formatElapsed(elapsed)} ago</div>
        </div>
      )}

      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        {status === 'idle' && onTrigger && (
          <button className="button button-primary" onClick={onTrigger}>Trigger</button>
        )}
        {(status === 'running') && onPause && (
          <button className="button" onClick={onPause}>Pause</button>
        )}
        {status === 'paused' && onPause && (
          <button className="button" onClick={onPause}>Resume</button>
        )}
        {(status === 'running' || status === 'paused') && onFinalize && (
          <button className="button" onClick={onFinalize}>Finalize</button>
        )}
        {(status === 'running' || status === 'paused') && onAbort && (
          <button className="button" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={onAbort}>Abort</button>
        )}
      </div>
    </div>
  );
};

export default CascadeStatus;
