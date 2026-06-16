"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/config.dir/schema.spec.md
 * Blocks: @block:config/structure, @block:config/watcher, @block:config/split, @block:config/embeddings, @block:config/database, @block:config/cascade, @block:config/agents
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CASCADE_CONFIG = exports.DEFAULT_DATABASE_CONFIG = exports.DEFAULT_EMBEDDING_CONFIG = exports.DEFAULT_SPLIT_CONFIG = exports.DEFAULT_WATCHER_CONFIG = void 0;
__exportStar(require("./schema.js"), exports);
__exportStar(require("./loader.js"), exports);
__exportStar(require("./validator.js"), exports);
// Default configuration constants
var schema_js_1 = require("./schema.js");
Object.defineProperty(exports, "DEFAULT_WATCHER_CONFIG", { enumerable: true, get: function () { return schema_js_1.DEFAULT_WATCHER_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_SPLIT_CONFIG", { enumerable: true, get: function () { return schema_js_1.DEFAULT_SPLIT_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_EMBEDDING_CONFIG", { enumerable: true, get: function () { return schema_js_1.DEFAULT_EMBEDDING_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_DATABASE_CONFIG", { enumerable: true, get: function () { return schema_js_1.DEFAULT_DATABASE_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_CASCADE_CONFIG", { enumerable: true, get: function () { return schema_js_1.DEFAULT_CASCADE_CONFIG; } });
//# sourceMappingURL=index.js.map