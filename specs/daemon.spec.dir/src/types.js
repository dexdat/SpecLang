"use strict";
/**
 * Type definitions for speclangd daemon simulation
 *
 * Generated from: @speclang/daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatusKind = exports.DaemonCommandKind = exports.DaemonStatusKind = exports.AgentTaskKind = exports.FileEventKind = void 0;
// File Events
var FileEventKind;
(function (FileEventKind) {
    FileEventKind["Create"] = "create";
    FileEventKind["Modify"] = "modify";
    FileEventKind["Delete"] = "delete";
    FileEventKind["Rename"] = "rename";
})(FileEventKind || (exports.FileEventKind = FileEventKind = {}));
var AgentTaskKind;
(function (AgentTaskKind) {
    AgentTaskKind["SpecWriter"] = "spec_writer";
    AgentTaskKind["CodeGen"] = "code_gen";
    AgentTaskKind["TestWriter"] = "test_writer";
    AgentTaskKind["BackSync"] = "back_sync";
})(AgentTaskKind || (exports.AgentTaskKind = AgentTaskKind = {}));
// Daemon Status
var DaemonStatusKind;
(function (DaemonStatusKind) {
    DaemonStatusKind["Idle"] = "idle";
    DaemonStatusKind["Cascading"] = "cascading";
    DaemonStatusKind["Converged"] = "converged";
    DaemonStatusKind["Paused"] = "paused";
    DaemonStatusKind["Error"] = "error";
})(DaemonStatusKind || (exports.DaemonStatusKind = DaemonStatusKind = {}));
// Daemon Commands (IPC)
var DaemonCommandKind;
(function (DaemonCommandKind) {
    DaemonCommandKind["Status"] = "status";
    DaemonCommandKind["Pause"] = "pause";
    DaemonCommandKind["Resume"] = "resume";
    DaemonCommandKind["Abort"] = "abort";
    DaemonCommandKind["Trigger"] = "trigger";
    DaemonCommandKind["Converge"] = "converge";
})(DaemonCommandKind || (exports.DaemonCommandKind = DaemonCommandKind = {}));
// Agent status
var AgentStatusKind;
(function (AgentStatusKind) {
    AgentStatusKind["Idle"] = "idle";
    AgentStatusKind["Busy"] = "busy";
    AgentStatusKind["Error"] = "error";
})(AgentStatusKind || (exports.AgentStatusKind = AgentStatusKind = {}));
//# sourceMappingURL=types.js.map