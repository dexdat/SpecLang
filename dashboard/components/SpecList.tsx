import React from 'react';

export interface SpecInfo {
  filePath: string;
  specId?: string;
  version?: string;
  layer?: number;
  ownedBy?: string;
  status?: string;
  targetLang?: string;
  tags?: string[];
  hasImplementation: boolean;
  hasHeader: boolean;
}

interface SpecListProps {
  specs: SpecInfo[];
  onSelectSpec?: (spec: SpecInfo) => void;
}

const statusBadge = (spec: SpecInfo): string => {
  if (!spec.hasHeader) return 'badge-error';
  if (!spec.specId) return 'badge-error';
  if (!spec.hasImplementation) return 'badge-idle';
  return 'badge-converged';
};

const statusLabel = (spec: SpecInfo): string => {
  if (!spec.hasHeader) return 'no header';
  if (!spec.specId) return 'no id';
  if (!spec.hasImplementation) return 'draft';
  return 'active';
};

export const SpecList: React.FC<SpecListProps> = ({ specs, onSelectSpec }) => {
  const [filter, setFilter] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'path' | 'layer' | 'status'>('path');

  const filtered = specs
    .filter(s => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        s.filePath.toLowerCase().includes(q) ||
        (s.specId || '').toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'path') return a.filePath.localeCompare(b.filePath);
      if (sortBy === 'layer') return (a.layer ?? 99) - (b.layer ?? 99);
      return statusLabel(a).localeCompare(statusLabel(b));
    });

  return (
    <div className="card" style={{ maxHeight: 400, overflow: 'auto' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 className="text-h3">Specs</h3>
        <span className="text-small text-muted">{filtered.length} / {specs.length}</span>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <input
          type="text"
          placeholder="Filter specs..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-small)',
            padding: 'var(--space-1) var(--space-2)',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
            border: 'var(--border-width) solid var(--color-primary)',
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'path' | 'layer' | 'status')}
          className="button"
          style={{ padding: 'var(--space-1) var(--space-2)' }}
        >
          <option value="path">Path</option>
          <option value="layer">Layer</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div style={{ fontSize: 'var(--text-small)' }}>
        {filtered.slice(0, 100).map((spec, i) => (
          <div
            key={spec.filePath}
            className="spec-row"
            style={{ cursor: onSelectSpec ? 'pointer' : 'default' }}
            onClick={() => onSelectSpec?.(spec)}
          >
            <span style={{ width: 32, color: 'var(--color-text-dimmed)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-tiny)' }}>
              {spec.layer ?? '-'}
            </span>
            <span style={{ flex: 1, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {spec.filePath}
            </span>
            <span className={`badge ${statusBadge(spec)}`} style={{ marginLeft: 'var(--space-2)', flexShrink: 0 }}>
              {statusLabel(spec)}
            </span>
          </div>
        ))}
        {filtered.length > 100 && (
          <div className="text-muted text-center" style={{ padding: 'var(--space-2)' }}>
            ...and {filtered.length - 100} more
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecList;
