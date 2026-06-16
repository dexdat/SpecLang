"use strict";
/**
 * OpenCode Integration Module
 *
 * SpecLang's OpenCode plugin for reactive spec-driven development.
 *
 * @module speclang/opencode
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
exports.getProfile = exports.loadConfig = exports.SpeclangPlugin = void 0;
exports.createPlugin = createPlugin;
exports.plugin = plugin;
__exportStar(require("./types"), exports);
__exportStar(require("./config"), exports);
__exportStar(require("./plugin"), exports);
const plugin_1 = require("./plugin");
Object.defineProperty(exports, "SpeclangPlugin", { enumerable: true, get: function () { return plugin_1.SpeclangPlugin; } });
const config_1 = require("./config");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_1.loadConfig; } });
Object.defineProperty(exports, "getProfile", { enumerable: true, get: function () { return config_1.getProfile; } });
/**
 * Create and configure the Speclang plugin
 */
async function createPlugin(context, options) {
    await (0, plugin_1.SpeclangPlugin)(context, options);
}
/**
 * Default plugin factory for OpenCode
 */
function plugin(context) {
    return () => (0, plugin_1.SpeclangPlugin)(context, {});
}
//# sourceMappingURL=index.js.map