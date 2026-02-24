import * as fs from 'fs';
import * as path from 'path';
import { MCPConfig } from './types';
import { ConfigLoader } from './loader';

export type ConfigChangeCallback = (config: MCPConfig) => void;

export class ConfigWatcher {
  private loader: ConfigLoader;
  private onChange?: ConfigChangeCallback;
  private watcher?: fs.FSWatcher;
  private debounceTimer?: NodeJS.Timeout;
  private debounceMs = 100;

  constructor(loader: ConfigLoader) {
    this.loader = loader;
  }

  start(onChange: ConfigChangeCallback): void {
    this.onChange = onChange;
    const configPath = this.loader.getConfigPath();
    const dir = path.dirname(configPath);
    const filename = path.basename(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.watcher = fs.watch(dir, (eventType, changedFilename) => {
      if (changedFilename === filename) {
        this.handleChange();
      }
    });

    console.log(`Watching for config changes: ${configPath}`);
  }

  private handleChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      try {
        const config = this.loader.load();
        this.onChange?.(config);
        console.log('Config reloaded');
      } catch (error) {
        console.error('Error reloading config:', error);
      }
    }, this.debounceMs);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    this.onChange = undefined;
    console.log('Stopped watching config');
  }

  isWatching(): boolean {
    return this.watcher !== undefined;
  }
}

export function createConfigWatcher(configPath?: string): ConfigWatcher {
  const loader = new ConfigLoader(configPath);
  return new ConfigWatcher(loader);
}
