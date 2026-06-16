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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemDashboard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
#;
speclang - header;
lines: 5;
#;
id: 
/ui-dashboard;
#;
version: 1.0;
.0;
#;
layer: 5;
/**
 * SystemDashboard - Main dashboard component
 * Generated from: @implementation/ui-dashboard
 */
const react_1 = __importStar(require("react"));
const DashboardHeader_1 = __importDefault(require("./DashboardHeader"));
const Sidebar_1 = __importDefault(require("./Sidebar"));
const MainContent_1 = __importDefault(require("./MainContent"));
const useCascadeStatus_1 = require("../hooks/useCascadeStatus");
const SystemDashboard = () => {
    const { cascadeState, queueDepth, convergenceTimer } = (0, useCascadeStatus_1.useCascadeStatus)();
    const { agents } = (0, useCascadeStatus_1.useAgentStatus)();
    const fileWatcher = (0, useCascadeStatus_1.useFileWatcherStatus)();
    const [activeSidebarItem, setActiveSidebarItem] = (0, react_1.useState)('overview');
    const handleUserControlsClick = () => {
        // TODO: Implement user controls modal
        console.log('User controls clicked');
    };
    const handleSidebarItemClick = (itemId) => {
        setActiveSidebarItem(itemId);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-[256px_1fr] grid-rows-[64px_1fr] min-h-screen bg-black text-white", children: [(0, jsx_runtime_1.jsx)(DashboardHeader_1.default, { queueDepth: queueDepth, convergenceTime: convergenceTimer, onUserControlsClick: handleUserControlsClick }), (0, jsx_runtime_1.jsx)(Sidebar_1.default, { activeItem: activeSidebarItem, onItemClick: handleSidebarItemClick }), (0, jsx_runtime_1.jsx)(MainContent_1.default, { cascadeState: cascadeState, agents: agents, fileWatcher: fileWatcher, activeView: activeSidebarItem })] }));
};
exports.SystemDashboard = SystemDashboard;
exports.default = exports.SystemDashboard;
//# sourceMappingURL=SystemDashboard.js.map