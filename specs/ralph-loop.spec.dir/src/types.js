"use strict";
// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
/**
 * Ralph Loop - Dual-agent system implementation
 *
 * This module provides the core types and interfaces for the Ralph Loop system.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DatabaseModule = require('better-sqlite3');
const Database = DatabaseModule.default || DatabaseModule;
exports.Database = Database;
//# sourceMappingURL=types.js.map