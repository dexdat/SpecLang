import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: mockFs,
  existsSync: mockFs.existsSync,
  readdirSync: mockFs.readdirSync,
  readFileSync: mockFs.readFileSync,
  statSync: mockFs.statSync,
}));

const mockApp = vi.hoisted(() => ({
  use: vi.fn().mockReturnThis(),
  get: vi.fn().mockReturnThis(),
  post: vi.fn().mockReturnThis(),
  listen: vi.fn().mockReturnValue({ close: vi.fn() }),
}));

vi.mock('express', () => {
  const json = vi.fn(() => vi.fn());
  const staticFn = vi.fn();
  const expressMock = Object.assign(() => mockApp, { json, static: staticFn });
  return { default: expressMock };
});

import {
  SpecEntry,
  HealthReport,
  CascadeInfo,
  createDashboardServer,
  startServer,
  scanSpecs,
  buildHealthReport,
} from '../../src/dashboard/server';

describe('Dashboard Server Exports', () => {
  it('should export SpecEntry interface', () => {
    const entry: SpecEntry = {
      filePath: 'specs/test.spec.md',
      specId: '@specs/test',
      version: '1.0.0',
      layer: 5,
      hasImplementation: false,
      hasHeader: true,
    };
    expect(entry.filePath).toBe('specs/test.spec.md');
    expect(entry.specId).toBe('@specs/test');
  });

  it('should export HealthReport interface', () => {
    const report: HealthReport = {
      totalSpecs: 10,
      withHeader: 8,
      withImplementation: 5,
      missingHeader: 2,
      noId: 1,
      noVersion: 0,
      byLayer: { 5: 10 },
      byStatus: { Alpha: 10 },
      byOwner: { team: 10 },
      metrics: [{ name: 'Total Specs', value: 10, status: 'good' }],
    };
    expect(report.totalSpecs).toBe(10);
    expect(report.metrics[0].status).toBe('good');
  });

  it('should export CascadeInfo interface', () => {
    const info: CascadeInfo = {
      status: 'idle',
      depth: 0,
      currentFile: null,
    };
    expect(info.status).toBe('idle');
  });
});

describe('Server Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an express app', () => {
    const app = createDashboardServer();
    expect(app).toBeDefined();
  });

  it('should register json middleware via app.use', () => {
    createDashboardServer();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should register /api/health route', () => {
    createDashboardServer();
    expect(mockApp.get).toHaveBeenCalledWith('/api/health', expect.any(Function));
  });

  it('should register /api/specs route', () => {
    createDashboardServer();
    expect(mockApp.get).toHaveBeenCalledWith('/api/specs', expect.any(Function));
  });

  it('should register /api/cascade route', () => {
    createDashboardServer();
    expect(mockApp.get).toHaveBeenCalledWith('/api/cascade', expect.any(Function));
  });

  it('should register cascade action routes', () => {
    createDashboardServer();
    expect(mockApp.post).toHaveBeenCalledWith('/api/cascade/trigger', expect.any(Function));
    expect(mockApp.post).toHaveBeenCalledWith('/api/cascade/pause', expect.any(Function));
    expect(mockApp.post).toHaveBeenCalledWith('/api/cascade/resume', expect.any(Function));
    expect(mockApp.post).toHaveBeenCalledWith('/api/cascade/abort', expect.any(Function));
    expect(mockApp.post).toHaveBeenCalledWith('/api/cascade/finalize', expect.any(Function));
  });
});

describe('buildHealthReport', () => {
  it('should return empty report for empty specs', () => {
    const report = buildHealthReport([]);
    expect(report.totalSpecs).toBe(0);
    expect(report.metrics[0].status).toBe('critical');
  });

  it('should calculate correct metrics', () => {
    const specs: SpecEntry[] = [
      {
        filePath: 'a.spec.md',
        specId: '@a',
        version: '1.0',
        layer: 5,
        status: 'Alpha',
        ownedBy: 'team1',
        hasImplementation: true,
        hasHeader: true,
      },
      {
        filePath: 'b.spec.md',
        hasImplementation: false,
        hasHeader: true,
      },
      {
        filePath: 'c.spec.md',
        hasImplementation: true,
        hasHeader: false,
      },
    ];

    const report = buildHealthReport(specs);
    expect(report.totalSpecs).toBe(3);
    expect(report.withHeader).toBe(2);
    expect(report.withImplementation).toBe(2);
    expect(report.missingHeader).toBe(1);
    expect(report.byLayer[5]).toBe(1);
    expect(report.byStatus['Alpha']).toBe(1);
    expect(report.byOwner['team1']).toBe(1);
  });
});

describe('scanSpecs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array if specs dir does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    const results = scanSpecs('/nonexistent');
    expect(results).toEqual([]);
  });

  it('should read spec files and parse headers', () => {
    mockFs.existsSync
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    mockFs.readdirSync
      .mockReturnValueOnce([{ name: 'test.spec.md', isDirectory: () => false }]);
    mockFs.readFileSync.mockReturnValue([
      '---',
      'id: @specs/test',
      'version: 1.0.0',
      'layer: 5',
      '---',
    ].join('\n'));
    const results = scanSpecs('/test-project');
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0) {
      expect(results[0].specId).toBe('@specs/test');
    }
  });
});

describe('startServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a server listening on specified port', () => {
    const server = startServer(3456);
    expect(server).toBeDefined();
    expect(mockApp.listen).toHaveBeenCalledWith(3456, expect.any(Function));
  });
});
