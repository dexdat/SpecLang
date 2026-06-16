import React from 'react';

export interface HealthMetric {
  name: string;
  value: number | string;
  status: 'good' | 'warn' | 'critical';
}

interface HealthGaugeProps {
  totalSpecs: number;
  withHeader: number;
  withImplementation: number;
  implRatio: string;
  metrics?: HealthMetric[];
}

const STATUS_COLOR: Record<string, string> = {
  good: 'var(--color-success)',
  warn: 'var(--color-warning)',
  critical: 'var(--color-error)',
};

const STATUS_ICON: Record<string, string> = {
  good: '\u2713',
  warn: '\u26A0',
  critical: '\u2717',
};

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  totalSpecs,
  withHeader,
  withImplementation,
  implRatio,
  metrics,
}) => {
  const headerPct = totalSpecs > 0 ? Math.round((withHeader / totalSpecs) * 100) : 0;
  const implPct = totalSpecs > 0 ? Math.round((withImplementation / totalSpecs) * 100) : 0;

  return (
    <div className="card">
      <h3 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>Health</h3>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div className="text-center">
          <div className="metric-value">{totalSpecs}</div>
          <div className="metric-label">Specs</div>
        </div>
        <div className="text-center">
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>{headerPct}%</div>
          <div className="metric-label">Headers</div>
        </div>
        <div className="text-center">
          <div className="metric-value" style={{ color: 'var(--color-info)' }}>{implRatio}</div>
          <div className="metric-label">Impl Ratio</div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex justify-between" style={{ marginBottom: 'var(--space-1)' }}>
          <span className="metric-label">Headers</span>
          <span className="text-data text-small">{withHeader}/{totalSpecs}</span>
        </div>
        <div className="bar-track">
          <div className="bar" style={{ width: `${headerPct}%`, background: 'var(--color-success)' }} />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex justify-between" style={{ marginBottom: 'var(--space-1)' }}>
          <span className="metric-label">Implementations</span>
          <span className="text-data text-small">{withImplementation}/{totalSpecs}</span>
        </div>
        <div className="bar-track">
          <div className="bar" style={{ width: `${implPct}%`, background: 'var(--color-info)' }} />
        </div>
      </div>

      {metrics && metrics.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 'var(--space-3)' }}>
          {metrics.map(m => (
            <div key={m.name} className="flex justify-between items-center" style={{ padding: 'var(--space-1) 0' }}>
              <span className="text-small">
                <span style={{ color: STATUS_COLOR[m.status], marginRight: 'var(--space-1)' }}>{STATUS_ICON[m.status]}</span>
                {m.name}
              </span>
              <span className="text-data text-small" style={{ color: STATUS_COLOR[m.status] }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthGauge;
