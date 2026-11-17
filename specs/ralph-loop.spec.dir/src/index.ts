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
// GAP-005: the second `LoopController` copy that lived beside this barrel is
// gone. It had no exit path (same defect class GAP-004 fixed in
// specs/implementation.spec.dir/src/ralph-loop.ts) and nothing imported this
// module, so the only correct home for `LoopController` is the live
// implementation — re-exporting a dead duplicate would reintroduce the defect.
export { BuilderAgent } from './builder-agent';
export { VerifierAgent } from './verifier-agent';
