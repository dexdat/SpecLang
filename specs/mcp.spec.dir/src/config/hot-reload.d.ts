import { MCPConfig } from './types';
import { ConfigLoader } from './loader';
export type ConfigChangeCallback = (config: MCPConfig) => void;
export declare class ConfigWatcher {
    private loader;
    private onChange?;
    private watcher?;
    private debounceTimer?;
    private debounceMs;
    constructor(loader: ConfigLoader);
    start(onChange: ConfigChangeCallback): void;
    private handleChange;
    stop(): void;
    isWatching(): boolean;
}
export declare function createConfigWatcher(configPath?: string): ConfigWatcher;
//# sourceMappingURL=hot-reload.d.ts.map