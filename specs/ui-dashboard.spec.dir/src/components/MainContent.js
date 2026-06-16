"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainContent = void 0;
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
 * MainContent component - displays dashboard content area
 * Generated from: @implementation/ui-dashboard
 */
const react_1 = __importDefault(require("react"));
const AgentCard = ({ agent }) => {
    const statusColor = {
        active: 'text-green-400',
        idle: 'text-gray-400',
        error: 'text-red-400',
    }[agent.status];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-900 border border-gray-800 rounded p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-mono text-sm", children: agent.name }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${statusColor}`, children: agent.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-gray-500", children: ["Tasks: ", agent.tasksCompleted] })] }));
};
const StatusCard = ({ title, value, status = 'info' }) => {
    const statusColors = {
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        info: 'text-blue-400',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-900 border border-gray-800 rounded p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-gray-500 mb-1", children: title }), (0, jsx_runtime_1.jsx)("div", { className: `text-2xl font-mono ${statusColors[status]}`, children: value })] }));
};
const FileWatcherCard = ({ status }) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-900 border border-gray-800 rounded p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-mono text-sm", children: "File Watcher" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${status.isWatching ? 'text-green-400' : 'text-gray-400'}`, children: status.isWatching ? 'Watching' : 'Stopped' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-gray-500", children: [(0, jsx_runtime_1.jsxs)("div", { children: ["Files Monitored: ", status.filesMonitored] }), status.lastChange && ((0, jsx_runtime_1.jsxs)("div", { children: ["Last Change: ", status.lastChange.toLocaleTimeString()] }))] })] }));
const MainContent = ({ cascadeState, agents = [], fileWatcher, activeView = 'overview', }) => {
    const renderOverview = () => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-mono mb-4", children: "System Status" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsx)(StatusCard, { title: "Queue Depth", value: cascadeState?.queueDepth ?? 0, status: cascadeState?.queueDepth === 0 ? 'success' : 'warning' }), (0, jsx_runtime_1.jsx)(StatusCard, { title: "Convergence Time", value: `${cascadeState?.convergenceTimer ?? 0}s`, status: "info" }), (0, jsx_runtime_1.jsx)(StatusCard, { title: "Active Agents", value: agents.filter((a) => a.status === 'active').length, status: "info" }), (0, jsx_runtime_1.jsx)(StatusCard, { title: "Files Watched", value: fileWatcher?.filesMonitored ?? 0, status: "info" })] })] }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-mono mb-4", children: "Agents" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-4", children: agents.length > 0 ? (agents.map((agent) => (0, jsx_runtime_1.jsx)(AgentCard, { agent: agent }, agent.id))) : ((0, jsx_runtime_1.jsx)("div", { className: "text-gray-500 text-sm", children: "No agents running" })) })] }), fileWatcher && ((0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-mono mb-4", children: "File Watcher" }), (0, jsx_runtime_1.jsx)(FileWatcherCard, { status: fileWatcher })] }))] }));
    const renderCascade = () => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-mono", children: "Cascade Status" }), (0, jsx_runtime_1.jsx)("div", { className: "bg-gray-900 border border-gray-800 rounded p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-4 h-4 rounded-full ${cascadeState?.status === 'running'
                                ? 'bg-green-500 animate-pulse'
                                : cascadeState?.status === 'converged'
                                    ? 'bg-blue-500'
                                    : cascadeState?.status === 'error'
                                        ? 'bg-red-500'
                                        : 'bg-gray-500'}` }), (0, jsx_runtime_1.jsx)("span", { className: "font-mono capitalize", children: cascadeState?.status ?? 'idle' })] }) })] }));
    const renderContent = () => {
        switch (activeView) {
            case 'cascade':
                return renderCascade();
            case 'agents':
                return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-mono", children: "Agents" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-4", children: agents.map((agent) => ((0, jsx_runtime_1.jsx)(AgentCard, { agent: agent }, agent.id))) })] }));
            default:
                return renderOverview();
        }
    };
    return ((0, jsx_runtime_1.jsx)("main", { className: "ml-64 mt-16 p-6 bg-black min-h-screen", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto", children: renderContent() }) }));
};
exports.MainContent = MainContent;
exports.default = exports.MainContent;
//# sourceMappingURL=MainContent.js.map