"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWatcher = void 0;
exports.createConfigWatcher = createConfigWatcher;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_1 = require("./loader");
class ConfigWatcher {
    loader;
    onChange;
    watcher;
    debounceTimer;
    debounceMs = 100;
    constructor(loader) {
        this.loader = loader;
    }
    start(onChange) {
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
    handleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            try {
                const config = this.loader.load();
                this.onChange?.(config);
                console.log('Config reloaded');
            }
            catch (error) {
                console.error('Error reloading config:', error);
            }
        }, this.debounceMs);
    }
    stop() {
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
    isWatching() {
        return this.watcher !== undefined;
    }
}
exports.ConfigWatcher = ConfigWatcher;
function createConfigWatcher(configPath) {
    const loader = new loader_1.ConfigLoader(configPath);
    return new ConfigWatcher(loader);
}
//# sourceMappingURL=hot-reload.js.map