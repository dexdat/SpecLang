"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/workflow.spec.md
 * Source: specs/workflow.dir/setup.spec.md
 * Source: specs/workflow.dir/daily-use.spec.md
 * Source: specs/workflow.dir/examples.spec.md
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processConversation = exports.executeParsedCommand = exports.parseCommand = exports.formatChanges = exports.showSpecDiff = exports.getChanges = exports.showStatus = exports.listSkills = exports.downloadSkills = exports.executeNorthStarCommand = exports.parseNorthStarCommand = exports.validateProject = exports.initProject = exports.main = exports.createCLI = void 0;
// CLI
var cli_js_1 = require("./cli.js");
Object.defineProperty(exports, "createCLI", { enumerable: true, get: function () { return cli_js_1.createCLI; } });
Object.defineProperty(exports, "main", { enumerable: true, get: function () { return cli_js_1.main; } });
// Setup
var setup_js_1 = require("./setup.js");
Object.defineProperty(exports, "initProject", { enumerable: true, get: function () { return setup_js_1.initProject; } });
Object.defineProperty(exports, "validateProject", { enumerable: true, get: function () { return setup_js_1.validateProject; } });
// Commands
var commands_js_1 = require("./commands.js");
Object.defineProperty(exports, "parseNorthStarCommand", { enumerable: true, get: function () { return commands_js_1.parseNorthStarCommand; } });
Object.defineProperty(exports, "executeNorthStarCommand", { enumerable: true, get: function () { return commands_js_1.executeNorthStarCommand; } });
Object.defineProperty(exports, "downloadSkills", { enumerable: true, get: function () { return commands_js_1.downloadSkills; } });
Object.defineProperty(exports, "listSkills", { enumerable: true, get: function () { return commands_js_1.listSkills; } });
// Review
var review_js_1 = require("./review.js");
Object.defineProperty(exports, "showStatus", { enumerable: true, get: function () { return review_js_1.showStatus; } });
Object.defineProperty(exports, "getChanges", { enumerable: true, get: function () { return review_js_1.getChanges; } });
Object.defineProperty(exports, "showSpecDiff", { enumerable: true, get: function () { return review_js_1.showSpecDiff; } });
Object.defineProperty(exports, "formatChanges", { enumerable: true, get: function () { return review_js_1.formatChanges; } });
// Conversation
var conversation_js_1 = require("./conversation.js");
Object.defineProperty(exports, "parseCommand", { enumerable: true, get: function () { return conversation_js_1.parseCommand; } });
Object.defineProperty(exports, "executeParsedCommand", { enumerable: true, get: function () { return conversation_js_1.executeParsedCommand; } });
Object.defineProperty(exports, "processConversation", { enumerable: true, get: function () { return conversation_js_1.processConversation; } });
//# sourceMappingURL=index.js.map