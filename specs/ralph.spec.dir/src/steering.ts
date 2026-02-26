/**
speclang-header lines:5
id: @specs/ralph
version: 1.0.0
layer: 5
 */

// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/steering-packets

/**
 * Ralph Loop - Steering Packet Management
 * 
 * Manages steering packets for communication between Builder and Verifier agents.
 * Steering packets are JSON stored in SQLite and include error reports,
 * fix suggestions, priority changes, and success confirmations.
 * 
 * @module ralph/steering
 */

import {
  SteeringPacket,
  SteeringPacketType,
  ErrorReportPacket,
  FixSuggestionPacket,
  PriorityChangePacket,
  SuccessConfirmationPacket,
} from './types';

/**
 * SteeringPacketBuilder - Fluent builder for creating steering packets
 */
export class SteeringPacketBuilder {
  private packet: Partial<SteeringPacket>;

  constructor() {
    this.packet = {
      created_at: Date.now(),
    };
  }

  /**
   * Set the task ID
   */
  withTaskId(taskId: string): SteeringPacketBuilder {
    this.packet.task_id = taskId;
    return this;
  }

  /**
   * Create an error report packet
   */
  asErrorReport(
    errorType: string,
    filePath: string,
    errorMessage: string,
    suggestedFix: string,
    priority: number = 5
  ): SteeringPacketBuilder {
    this.packet.type = 'error_report';
    this.packet.payload = {
      task_id: this.packet.task_id || '',
      error_type: errorType,
      file_path: filePath,
      error_message: errorMessage,
      suggested_fix: suggestedFix,
      priority,
    } as ErrorReportPacket;
    return this;
  }

  /**
   * Create a fix suggestion packet
   */
  asFixSuggestion(
    filePath: string,
    currentState: string,
    suggestedChange: string,
    rationale: string
  ): SteeringPacketBuilder {
    this.packet.type = 'fix_suggestion';
    this.packet.payload = {
      task_id: this.packet.task_id || '',
      file_path: filePath,
      current_state: currentState,
      suggested_change: suggestedChange,
      rationale,
    } as FixSuggestionPacket;
    return this;
  }

  /**
   * Create a priority change packet
   */
  asPriorityChange(
    newPriority: number,
    reason: string,
    dependencies: string[] = []
  ): SteeringPacketBuilder {
    this.packet.type = 'priority_change';
    this.packet.payload = {
      task_id: this.packet.task_id || '',
      new_priority: newPriority,
      reason,
      dependencies,
    } as PriorityChangePacket;
    return this;
  }

  /**
   * Create a success confirmation packet
   */
  asSuccessConfirmation(
    filesCreated: string[],
    testsPassed: boolean,
    nextRecommendation: string = ''
  ): SteeringPacketBuilder {
    this.packet.type = 'success_confirmation';
    this.packet.payload = {
      task_id: this.packet.task_id || '',
      files_created: filesCreated,
      tests_passed: testsPassed,
      next_recommendation: nextRecommendation,
    } as SuccessConfirmationPacket;
    return this;
  }

  /**
   * Build the steering packet
   */
  build(): SteeringPacket {
    if (!this.packet.task_id) {
      throw new Error('task_id is required');
    }
    if (!this.packet.type) {
      throw new Error('packet type is required');
    }
    if (!this.packet.payload) {
      throw new Error('packet payload is required');
    }
    return this.packet as SteeringPacket;
  }
}

/**
 * Create a new steering packet builder
 */
export function createSteeringPacket(): SteeringPacketBuilder {
  return new SteeringPacketBuilder();
}

/**
 * Extract error report from steering packet
 */
export function extractErrorReport(packet: SteeringPacket): ErrorReportPacket | null {
  if (packet.type === 'error_report') {
    return packet.payload as ErrorReportPacket;
  }
  return null;
}

/**
 * Extract fix suggestion from steering packet
 */
export function extractFixSuggestion(packet: SteeringPacket): FixSuggestionPacket | null {
  if (packet.type === 'fix_suggestion') {
    return packet.payload as FixSuggestionPacket;
  }
  return null;
}

/**
 * Extract priority change from steering packet
 */
export function extractPriorityChange(packet: SteeringPacket): PriorityChangePacket | null {
  if (packet.type === 'priority_change') {
    return packet.payload as PriorityChangePacket;
  }
  return null;
}

/**
 * Extract success confirmation from steering packet
 */
export function extractSuccessConfirmation(packet: SteeringPacket): SuccessConfirmationPacket | null {
  if (packet.type === 'success_confirmation') {
    return packet.payload as SuccessConfirmationPacket;
  }
  return null;
}

/**
 * Get packet priority (higher = more important)
 */
export function getPacketPriority(packet: SteeringPacket): number {
  if (packet.type === 'error_report') {
    const report = packet.payload as ErrorReportPacket;
    return report.priority;
  }
  if (packet.type === 'priority_change') {
    const change = packet.payload as PriorityChangePacket;
    return change.new_priority;
  }
  // Default priority for other types
  return 5;
}

/**
 * Serialize steering packet to JSON string
 */
export function serializePacket(packet: SteeringPacket): string {
  return JSON.stringify(packet);
}

/**
 * Deserialize steering packet from JSON string
 */
export function deserializePacket(json: string): SteeringPacket {
  return JSON.parse(json) as SteeringPacket;
}
