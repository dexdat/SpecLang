"use strict";
/**
 * UI Dashboard main exports
 * Generated from: @implementation/ui-dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileWatcherStatus = exports.useAgentStatus = exports.useCascadeStatus = exports.CascadeIndicatorDefault = exports.CascadeIndicator = exports.MainContentDefault = exports.MainContent = exports.SidebarDefault = exports.Sidebar = exports.DashboardHeaderDefault = exports.DashboardHeader = exports.SystemDashboardDefault = exports.SystemDashboard = void 0;
// Components
var SystemDashboard_1 = require("./components/SystemDashboard");
Object.defineProperty(exports, "SystemDashboard", { enumerable: true, get: function () { return SystemDashboard_1.SystemDashboard; } });
Object.defineProperty(exports, "SystemDashboardDefault", { enumerable: true, get: function () { return __importDefault(SystemDashboard_1).default; } });
var DashboardHeader_1 = require("./components/DashboardHeader");
Object.defineProperty(exports, "DashboardHeader", { enumerable: true, get: function () { return DashboardHeader_1.DashboardHeader; } });
Object.defineProperty(exports, "DashboardHeaderDefault", { enumerable: true, get: function () { return __importDefault(DashboardHeader_1).default; } });
var Sidebar_1 = require("./components/Sidebar");
Object.defineProperty(exports, "Sidebar", { enumerable: true, get: function () { return Sidebar_1.Sidebar; } });
Object.defineProperty(exports, "SidebarDefault", { enumerable: true, get: function () { return __importDefault(Sidebar_1).default; } });
var MainContent_1 = require("./components/MainContent");
Object.defineProperty(exports, "MainContent", { enumerable: true, get: function () { return MainContent_1.MainContent; } });
Object.defineProperty(exports, "MainContentDefault", { enumerable: true, get: function () { return __importDefault(MainContent_1).default; } });
var CascadeIndicator_1 = require("./components/CascadeIndicator");
Object.defineProperty(exports, "CascadeIndicator", { enumerable: true, get: function () { return CascadeIndicator_1.CascadeIndicator; } });
Object.defineProperty(exports, "CascadeIndicatorDefault", { enumerable: true, get: function () { return __importDefault(CascadeIndicator_1).default; } });
// Hooks
var useCascadeStatus_1 = require("./hooks/useCascadeStatus");
Object.defineProperty(exports, "useCascadeStatus", { enumerable: true, get: function () { return useCascadeStatus_1.useCascadeStatus; } });
Object.defineProperty(exports, "useAgentStatus", { enumerable: true, get: function () { return useCascadeStatus_1.useAgentStatus; } });
Object.defineProperty(exports, "useFileWatcherStatus", { enumerable: true, get: function () { return useCascadeStatus_1.useFileWatcherStatus; } });
//# sourceMappingURL=index.js.map