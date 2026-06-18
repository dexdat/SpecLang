import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';

export interface FileChangeEvent {
  filePath: string;
  changeType: 'add' | 'change' | 'unlink';
  timestamp: number;
}

export interface FileWatcherOptions {
  paths?: string[];
  ignored?: string[];
  debounceMs?: number;
  chokidarOptions?: any;
}

export const DEFAULT_PATHS: string[] = ['specs/**/*.spec.{md,yaml,scl}', '**/project.scl'];

export const DEFAULT_IGNORED: string[] = ['**/.git/**', '**/node_modules/**', '**/.speclang/**', '**/dist/**'];

export class FileWatcher extends EventEmitter {
  private paths: string[];
  private ignored: string[];
  private debounceMs: number;
  private chokidarOptions: any;
  private watcher: FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options?: FileWatcherOptions) {
    super();
    this.paths = options?.paths ?? [...DEFAULT_PATHS];
    this.ignored = options?.ignored ?? [...DEFAULT_IGNORED];
    this.debounceMs = options?.debounceMs ?? 300;
    this.chokidarOptions = options?.chokidarOptions ?? {};
  }

  watch(): void {
    if (this.watcher) return;

    this.watcher = watch(this.paths, {
      ignored: this.ignored,
      ...this.chokidarOptions,
    });

    const events: Array<'add' | 'change' | 'unlink'> = ['add', 'change', 'unlink'];
    for (const eventType of events) {
      this.watcher.on(eventType, (filePath: string) => {
        this.handleEvent(filePath, eventType);
      });
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    Array.from(this.debounceTimers.values()).forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  private handleEvent(filePath: string, changeType: 'add' | 'change' | 'unlink'): void {
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      filePath,
      setTimeout(() => {
        this.debounceTimers.delete(filePath);
        const event: FileChangeEvent = {
          filePath,
          changeType,
          timestamp: Date.now(),
        };
        this.emit('change', event);
      }, this.debounceMs)
    );
  }
}
