"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Index
 * Source: @speclang/mcp
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
exports.errors = exports.getArgBool = exports.getArgInt = exports.getArg = exports.loadConfig = exports.SSEManager = exports.createSSEManager = exports.MCPAuth = exports.createAuth = exports.getToolDefinitions = exports.MCPToolRegistry = exports.MCPServer = void 0;
var server_js_1 = require("./server.js");
Object.defineProperty(exports, "MCPServer", { enumerable: true, get: function () { return server_js_1.MCPServer; } });
var index_js_1 = require("./tools/index.js");
Object.defineProperty(exports, "MCPToolRegistry", { enumerable: true, get: function () { return index_js_1.MCPToolRegistry; } });
Object.defineProperty(exports, "getToolDefinitions", { enumerable: true, get: function () { return index_js_1.getToolDefinitions; } });
var auth_js_1 = require("./auth.js");
Object.defineProperty(exports, "createAuth", { enumerable: true, get: function () { return auth_js_1.createAuth; } });
Object.defineProperty(exports, "MCPAuth", { enumerable: true, get: function () { return auth_js_1.MCPAuth; } });
var sse_js_1 = require("./sse.js");
Object.defineProperty(exports, "createSSEManager", { enumerable: true, get: function () { return sse_js_1.createSSEManager; } });
Object.defineProperty(exports, "SSEManager", { enumerable: true, get: function () { return sse_js_1.SSEManager; } });
var config_js_1 = require("./config.js");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_js_1.loadConfig; } });
Object.defineProperty(exports, "getArg", { enumerable: true, get: function () { return config_js_1.getArg; } });
Object.defineProperty(exports, "getArgInt", { enumerable: true, get: function () { return config_js_1.getArgInt; } });
Object.defineProperty(exports, "getArgBool", { enumerable: true, get: function () { return config_js_1.getArgBool; } });
exports.errors = __importStar(require("./errors/index.js"));
//# sourceMappingURL=index.js.map