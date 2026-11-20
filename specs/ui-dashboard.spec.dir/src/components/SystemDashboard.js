"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemDashboard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
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