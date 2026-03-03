"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeIndicator = void 0;
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
 * CascadeIndicator component showing current cascade state
 * Generated from: @implementation/ui-dashboard
 */
const react_1 = __importDefault(require("react"));
const statusColors = {
    idle: 'bg-gray-500',
    running: 'bg-green-500 animate-pulse',
    converged: 'bg-blue-500',
    error: 'bg-red-500',
};
const statusLabels = {
    idle: 'Idle',
    running: 'Running',
    converged: 'Converged',
    error: 'Error',
};
const CascadeIndicator = ({ status = 'idle', size = 'md', }) => {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `rounded-full ${sizeClasses[size]} ${statusColors[status]}`, title: `Cascade Status: ${statusLabels[status]}` }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-400", children: statusLabels[status] })] }));
};
exports.CascadeIndicator = CascadeIndicator;
exports.default = exports.CascadeIndicator;
//# sourceMappingURL=CascadeIndicator.js.map