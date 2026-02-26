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
 * Ralph Loop - Dual-agent System Implementation
 * 
 * A meta-circular development system where specs self-assemble into code.
 * This module provides the core components for coordinating Builder and
 * Verifier agents via SQLite commands table.
 * 
 * @module ralph-loop
 */

// Re-export types
export {
  Task,
  TaskStatus,
  TaskAssignment,
  BuilderResult,
  VerificationResult,
  SteeringPacket,
  SteeringPacketType,
  DatabaseInstance
} from './types';

// Re-export classes
export { LoopController } from './controller';
export { BuilderAgent } from './builder-agent';
export { VerifierAgent } from './verifier-agent';
