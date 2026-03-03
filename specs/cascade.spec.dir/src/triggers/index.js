"use strict";
// SPECLANG-GENERATED: @speclang/cascade/triggers
// Main exports for cascade triggers module
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
exports.InMemoryAgentRegistry = exports.TriggerRouter = void 0;
// Types
__exportStar(require("./types"), exports);
// Sources
__exportStar(require("./sources"), exports);
// Router
var router_1 = require("./router");
Object.defineProperty(exports, "TriggerRouter", { enumerable: true, get: function () { return router_1.TriggerRouter; } });
Object.defineProperty(exports, "InMemoryAgentRegistry", { enumerable: true, get: function () { return router_1.InMemoryAgentRegistry; } });
// Handlers
__exportStar(require("./handlers"), exports);
// Watcher
__exportStar(require("./watcher"), exports);
//# sourceMappingURL=index.js.map