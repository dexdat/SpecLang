"use strict";
/**
 * SPECLANG-GENERATED: Compiler Phases Module
 * Source: @speclang/compiler.spec.dir/phases
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
exports.invalidateCache = exports.compileIncremental = exports.syncSpecToCode = exports.syncCodeToSpec = exports.detectDrift = exports.codegen = exports.transform = exports.resolve = exports.validate = exports.parsePhase = exports.parse = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./errors"), exports);
var parse_1 = require("./parse");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parse_1.parse; } });
Object.defineProperty(exports, "parsePhase", { enumerable: true, get: function () { return parse_1.parsePhase; } });
var validate_1 = require("./validate");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validate_1.validate; } });
var resolve_1 = require("./resolve");
Object.defineProperty(exports, "resolve", { enumerable: true, get: function () { return resolve_1.resolve; } });
var transform_1 = require("./transform");
Object.defineProperty(exports, "transform", { enumerable: true, get: function () { return transform_1.transform; } });
var codegen_1 = require("./codegen");
Object.defineProperty(exports, "codegen", { enumerable: true, get: function () { return codegen_1.codegen; } });
var sync_1 = require("./sync");
Object.defineProperty(exports, "detectDrift", { enumerable: true, get: function () { return sync_1.detectDrift; } });
Object.defineProperty(exports, "syncCodeToSpec", { enumerable: true, get: function () { return sync_1.syncCodeToSpec; } });
Object.defineProperty(exports, "syncSpecToCode", { enumerable: true, get: function () { return sync_1.syncSpecToCode; } });
var incremental_1 = require("./incremental");
Object.defineProperty(exports, "compileIncremental", { enumerable: true, get: function () { return incremental_1.compileIncremental; } });
Object.defineProperty(exports, "invalidateCache", { enumerable: true, get: function () { return incremental_1.invalidateCache; } });
__exportStar(require("./plugins"), exports);
//# sourceMappingURL=index.js.map