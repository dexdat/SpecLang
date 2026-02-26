// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop

/**
 * Ralph Loop - Dual-Agent System Implementation
 * 
 * Dual-agent Ralph Loop with steering packets for building Speclang using Speclang.
 * This is a meta-circular development system where specs self-assemble into code.
 * 
 * @module ralph
 */

// Re-export types
export {
  // Agent Types
  BuilderAgent,
  BuilderRole,
  BuilderCapability,
  BuilderTrigger,
  BuilderOutput,
  VerifierAgent,
  VerifierRole,
  VerifierCapability,
  ValidationStage,
  
  // Steering Packet Types
  SteeringPacket,
  SteeringPacketType,
  ErrorReportPacket,
  FixSuggestionPacket,
  PriorityChangePacket,
  SuccessConfirmationPacket,
  
  // Validation Types
  ValidationPipelineStage,
  ValidationResult,
  
  // Task Types
  Task,
  TaskStatus,
  TaskAssignment,
  TaskComplexity,
  TodoList,
  
  // Loop Types
  LoopState,
  LoopConfig,
  
  // Phase Types
  ImplementationPhase,
  PhaseDetails,
  
  // Failure Domain Types
  FailureDomain,
  EngineeringResponse,
  
  // Result Types
  BuilderResult,
  VerificationResult,
  
  // Constants
  DEFAULT_LOOP_CONFIG,
  VALIDATION_PIPELINE,
  IMPLEMENTATION_PHASES,
} from './types';

// Re-export steering module
export {
  SteeringPacketBuilder,
  createSteeringPacket,
  extractErrorReport,
  extractFixSuggestion,
  extractPriorityChange,
  extractSuccessConfirmation,
  getPacketPriority,
  serializePacket,
  deserializePacket,
} from './steering';

// Re-export Builder Agent
export {
  RalphBuilderAgent,
  BuilderAgentConfig,
  createBuilderAgent,
} from './builder';

// Re-export Verifier Agent
export {
  RalphVerifierAgent,
  VerifierAgentConfig,
  createVerifierAgent,
} from './verifier';

// Re-export Loop Controller
export {
  RalphLoop,
  createRalphLoop,
} from './loop';
