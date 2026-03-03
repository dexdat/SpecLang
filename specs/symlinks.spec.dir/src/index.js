"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/symlinks.spec.md, specs/symlinks.spec.dir/creation.spec.md, specs/symlinks.spec.dir/verification.spec.md
 * Blocks: @block:symlinks/overview, @block:symlinks/dual-view, @block:symlinks/tools
 * Generated: 2026-02-23
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
exports.getPlatformConfig = exports.DEFAULT_FALLBACK_CONFIG = exports.DEFAULT_GIT_SYMLINKS_CONFIG = exports.DEFAULT_DUAL_VIEW_CONFIG = void 0;
__exportStar(require("./types.js"), exports);
__exportStar(require("./creator.js"), exports);
__exportStar(require("./verifier.js"), exports);
__exportStar(require("./rebuilder.js"), exports);
// Default configuration exports
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "DEFAULT_DUAL_VIEW_CONFIG", { enumerable: true, get: function () { return types_js_1.DEFAULT_DUAL_VIEW_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_GIT_SYMLINKS_CONFIG", { enumerable: true, get: function () { return types_js_1.DEFAULT_GIT_SYMLINKS_CONFIG; } });
Object.defineProperty(exports, "DEFAULT_FALLBACK_CONFIG", { enumerable: true, get: function () { return types_js_1.DEFAULT_FALLBACK_CONFIG; } });
Object.defineProperty(exports, "getPlatformConfig", { enumerable: true, get: function () { return types_js_1.getPlatformConfig; } });
//# sourceMappingURL=index.js.map