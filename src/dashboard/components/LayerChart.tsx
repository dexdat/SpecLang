import React from 'react';

interface LayerChartProps {
  byLayer: Record<number, number>;
}

const LAYER_COLORS: Record<number, string> = {
  0: '#ef4444',
  1: '#f97316',
  2: '#f59e0b',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e',
  6: '#14b8a6',
  7: '#06b6d4',
  8: '#3b82f6',
  9: '#6366f1',
  10: '#8b5cf6',
};

const LAYER_NAMES: Record<number, string> = {
  0: 'North Star',
  1: 'Principles',
  2: 'Architecture',
  3: 'Modules',
  4: 'Features',
  5: 'Specs',
  6: 'Implementations',
  7: 'Tests',
  8: 'Config',
  9: 'Scripts',
  10: 'Examples',
};

export const LayerChart: React.FC<LayerChartProps> = ({ byLayer }) => {
  const entries = Object.entries(byLayer)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([a], [b]) => a - b);

  const maxCount = Math.max(...entries.map(([, c]) => c), 1);

  return (
    <div className="card">
      <h3 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>Layers</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {entries.map(([layer, count]) => {
          const pct = (count / maxCount) * 100;
          const color = LAYER_COLORS[layer] || 'var(--color-accent)';
          const name = LAYER_NAMES[layer] || `Layer ${layer}`;

          return (
            <div key={layer}>
              <div className="flex justify-between" style={{ marginBottom: 2 }}>
                <span className="text-tiny text-label" style={{ color }}>
                  L{layer} {name}
                </span>
                <span className="text-tiny text-data text-muted">{count}</span>
              </div>
              <div className="bar-track" style={{ height: 16 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    transition: 'width var(--duration-normal) var(--ease-brutal)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-muted text-center text-small" style={{ padding: 'var(--space-4)' }}>
          No layer data available
        </div>
      )}
    </div>
  );
};

export default LayerChart;
