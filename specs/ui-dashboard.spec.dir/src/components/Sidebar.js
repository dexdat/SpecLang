"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = void 0;
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
 * Sidebar component for navigation
 * Generated from: @implementation/ui-dashboard
 */
const react_1 = __importDefault(require("react"));
const defaultNavItems = [
    { id: 'overview', label: 'Overview', icon: '◉' },
    { id: 'cascade', label: 'Cascade', icon: '⟳', badge: 0 },
    { id: 'agents', label: 'Agents', icon: '◈' },
    { id: 'files', label: 'File Watcher', icon: '◫' },
    { id: 'specs', label: 'Specs', icon: '☰' },
    { id: 'logs', label: 'Logs', icon: '☷' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
];
const Sidebar = ({ activeItem = 'overview', onItemClick, }) => {
    const handleItemClick = (itemId) => {
        if (onItemClick) {
            onItemClick(itemId);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "fixed left-0 top-16 bottom-0 w-64 bg-black border-r border-gray-800", children: [(0, jsx_runtime_1.jsx)("nav", { className: "p-4", children: (0, jsx_runtime_1.jsx)("ul", { className: "space-y-1", children: defaultNavItems.map((item) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("button", { className: `w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${activeItem === item.id
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`, onClick: () => handleItemClick(item.id), children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-4 text-center", children: item.icon }), item.label] }), item.badge !== undefined && item.badge > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-0.5 text-xs bg-blue-600 rounded-full", children: item.badge }))] }) }, item.id))) }) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-gray-500", children: [(0, jsx_runtime_1.jsx)("div", { children: "SpecLang v1.0.0" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-1", children: "MCP Server: Connected" })] }) })] }));
};
exports.Sidebar = Sidebar;
exports.default = exports.Sidebar;
//# sourceMappingURL=Sidebar.js.map