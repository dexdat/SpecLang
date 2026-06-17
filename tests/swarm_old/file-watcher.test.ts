import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileWatcher, DEFAULT_PATHS, DEFAULT_IGNORED } from '../../src/swarm/file-watcher';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-swarm-test-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

async function waitForEvent(watcher: FileWatcher, timeoutMs: number = 2000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      watcher.removeAllListeners('change');
      reject(new Error('Timed out waiting for file change event'));
    }, timeoutMs);

    watcher.once('change', (event: any) => {
      clearTimeout(timer);
      resolve(event);
    });
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('FileWatcher', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect a file add event', async () => {
    const watcher = new FileWatcher({
      paths: [tmpDir],
      debounceMs: 50,
    });
    watcher.watch();

    writeFile(tmpDir, 'test.spec.md', '# Hello\n');
    const event = await waitForEvent(watcher);

    expect(event).toBeDefined();
    expect(event.filePath).toContain('test.spec.md');
    expect(event.changeType).toBe('add');
    expect(event.timestamp).toBeGreaterThan(0);

    watcher.stop();
  });

  it('should detect a file change event', async () => {
    const filePath = writeFile(tmpDir, 'test.spec.md', '# Hello\n');
    const watcher = new FileWatcher({
      paths: [tmpDir],
      debounceMs: 50,
    });
    watcher.watch();

    await delay(100);
    fs.writeFileSync(filePath, '# Hello World\n', 'utf-8');
    const event = await waitForEvent(watcher);

    expect(event).toBeDefined();
    expect(event.filePath).toBe(filePath);
    expect(event.changeType).toBe('change');

    watcher.stop();
  });

  it('should detect a file unlink event', async () => {
    const filePath = writeFile(tmpDir, 'test.spec.md', '# Hello\n');
    const watcher = new FileWatcher({
      paths: [tmpDir],
      debounceMs: 50,
    });
    watcher.watch();

    await delay(100);
    fs.unlinkSync(filePath);
    const event = await waitForEvent(watcher);

    expect(event).toBeDefined();
    expect(event.filePath).toBe(filePath);
    expect(event.changeType).toBe('unlink');

    watcher.stop();
  });

  it('should debounce rapid file changes', async () => {
    const filePath = writeFile(tmpDir, 'test.spec.md', '# Hello\n');
    const watcher = new FileWatcher({
      paths: [tmpDir],
      debounceMs: 200,
      chokidarOptions: { usePolling: true, interval: 50 },
    });
    watcher.watch();

    await delay(100);
    fs.writeFileSync(filePath, '# Change 1\n', 'utf-8');
    await delay(50);
    fs.writeFileSync(filePath, '# Change 2\n', 'utf-8');
    await delay(50);
    fs.writeFileSync(filePath, '# Change 3\n', 'utf-8');

    const event = await waitForEvent(watcher, 1000);
    expect(event).toBeDefined();
    expect(event.changeType).toBe('change');
    expect(event.filePath).toBe(filePath);

    watcher.stop();
  });

  it('should watch project.scl files by default', async () => {
    const watcher = new FileWatcher({
      paths: [tmpDir],
      debounceMs: 50,
    });
    watcher.watch();

    writeFile(tmpDir, 'project.scl', 'name: test\n');
    const event = await waitForEvent(watcher);

    expect(event).toBeDefined();
    expect(path.basename(event.filePath)).toBe('project.scl');

    watcher.stop();
  });

  it('should stop watching after stop()', async () => {
    const watcher = new FileWatcher({
      paths: [`${tmpDir}/**/*.spec.md`],
      debounceMs: 50,
    });
    watcher.watch();
    watcher.stop();

    await delay(100);
    writeFile(tmpDir, 'test.spec.md', '# Hello\n');

    let eventReceived = false;
    watcher.once('change', () => { eventReceived = true; });
    await delay(300);
    expect(eventReceived).toBe(false);
  });

  it('should have default paths and ignored patterns', () => {
    expect(DEFAULT_PATHS).toContain('specs/**/*.spec.{md,yaml,scl}');
    expect(DEFAULT_PATHS).toContain('**/project.scl');
    expect(DEFAULT_IGNORED).toContain('**/.git/**');
    expect(DEFAULT_IGNORED).toContain('**/node_modules/**');
    expect(DEFAULT_IGNORED).toContain('**/.speclang/**');
    expect(DEFAULT_IGNORED).toContain('**/dist/**');
  });
});
