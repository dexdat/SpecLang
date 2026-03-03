"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardHeader = void 0;
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
 * DashboardHeader component
 * Generated from: @implementation/ui-dashboard
 */
const react_1 = __importDefault(require("react"));
const CascadeIndicator_1 = require("./CascadeIndicator");
const DashboardHeader = ({ queueDepth = 0, convergenceTime = 0, onUserControlsClick, }) => {
    return ((0, jsx_runtime_1.jsx)("header", { className: "fixed top-0 left-0 right-0 h-16 bg-black border-b border-gray-800 grid-texture", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between px-6 h-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-mono", children: "SpecLang System Dashboard" }), (0, jsx_runtime_1.jsx)(CascadeIndicator_1.CascadeIndicator, {})] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-400", children: ["Queue depth: ", (0, jsx_runtime_1.jsx)("span", { className: "text-green-400", children: queueDepth })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-400", children: ["Convergence: ", (0, jsx_runtime_1.jsxs)("span", { className: "text-yellow-400", children: [convergenceTime, "s"] })] }), (0, jsx_runtime_1.jsx)("button", { className: "px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm", onClick: onUserControlsClick, children: "User Controls" })] })] }) }));
};
exports.DashboardHeader = DashboardHeader;
exports.default = exports.DashboardHeader;
//# sourceMappingURL=DashboardHeader.js.map