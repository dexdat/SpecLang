"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib
// DO NOT EDIT MANUALLY
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
exports.STDLIB_NAME = exports.VERSION = void 0;
/**
 * SpecLang Standard Library
 *
 * Built-in types, functions, and assertions available to all specs without import.
 *
 * @package @speclang/stdlib
 * @version 0.1.0
 */
// Re-export all modules
__exportStar(require("./primitives"), exports);
__exportStar(require("./composites"), exports);
__exportStar(require("./results"), exports);
__exportStar(require("./functions"), exports);
__exportStar(require("./assertions"), exports);
__exportStar(require("./validators"), exports);
__exportStar(require("./mapping"), exports);
__exportStar(require("./types"), exports);
// Version info
exports.VERSION = '0.1.0';
exports.STDLIB_NAME = '@speclang/stdlib';
//# sourceMappingURL=index.js.map