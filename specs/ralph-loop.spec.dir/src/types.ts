/**
speclang-header lines:5
id: @specs/ralph-loop
version: 1.0.0
layer: 5
 */

// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop

/**
 * Ralph Loop - Dual-agent system implementation
 * 
 * This module provides the core types and interfaces for the Ralph Loop system.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DatabaseModule = require('better-sqlite3');
const Database = DatabaseModule.default || DatabaseModule;

/**
 * Task status enum
 */
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'failed';

/**
 * Task assignment type
 */
export type TaskAssignment = 'builder' | 'verifier' | null;

/**
 * Task interface representing a unit of work in the Ralph Loop
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigned_to: TaskAssignment;
  created_at: number;
  updated_at: number;
}

/**
 * Result from BuilderAgent execution
 */
export interface BuilderResult {
  output: {
    specPath?: string;
    codeFiles?: string[];
  } | null;
  error?: string;
}

/**
 * Verification result from VerifierAgent
 */
export interface VerificationResult {
  success: boolean;
  errors: string[];
}

/**
 * Steering packet types
 */
export type SteeringPacketType = 'error_report' | 'fix_suggestion' | 'priority_change';

/**
 * Steering packet interface
 */
export interface SteeringPacket {
  id?: number;
  task_id: string;
  type: SteeringPacketType;
  payload: string;
  created_at: number;
  processed?: boolean;
  processed_at?: number;
}

/**
 * Database instance type - uses any to avoid import issues with better-sqlite3
 */
export type DatabaseInstance = ReturnType<typeof Database>;

/**
 * Re-export Database constructor for external use
 */
export { Database };
