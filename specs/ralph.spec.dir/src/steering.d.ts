/**
 * Ralph Loop - Steering Packet Management
 *
 * Manages steering packets for communication between Builder and Verifier agents.
 * Steering packets are JSON stored in SQLite and include error reports,
 * fix suggestions, priority changes, and success confirmations.
 *
 * @module ralph/steering
 */
import { SteeringPacket, ErrorReportPacket, FixSuggestionPacket, PriorityChangePacket, SuccessConfirmationPacket } from './types';
/**
 * SteeringPacketBuilder - Fluent builder for creating steering packets
 */
export declare class SteeringPacketBuilder {
    private packet;
    constructor();
    /**
     * Set the task ID
     */
    withTaskId(taskId: string): SteeringPacketBuilder;
    /**
     * Create an error report packet
     */
    asErrorReport(errorType: string, filePath: string, errorMessage: string, suggestedFix: string, priority?: number): SteeringPacketBuilder;
    /**
     * Create a fix suggestion packet
     */
    asFixSuggestion(filePath: string, currentState: string, suggestedChange: string, rationale: string): SteeringPacketBuilder;
    /**
     * Create a priority change packet
     */
    asPriorityChange(newPriority: number, reason: string, dependencies?: string[]): SteeringPacketBuilder;
    /**
     * Create a success confirmation packet
     */
    asSuccessConfirmation(filesCreated: string[], testsPassed: boolean, nextRecommendation?: string): SteeringPacketBuilder;
    /**
     * Build the steering packet
     */
    build(): SteeringPacket;
}
/**
 * Create a new steering packet builder
 */
export declare function createSteeringPacket(): SteeringPacketBuilder;
/**
 * Extract error report from steering packet
 */
export declare function extractErrorReport(packet: SteeringPacket): ErrorReportPacket | null;
/**
 * Extract fix suggestion from steering packet
 */
export declare function extractFixSuggestion(packet: SteeringPacket): FixSuggestionPacket | null;
/**
 * Extract priority change from steering packet
 */
export declare function extractPriorityChange(packet: SteeringPacket): PriorityChangePacket | null;
/**
 * Extract success confirmation from steering packet
 */
export declare function extractSuccessConfirmation(packet: SteeringPacket): SuccessConfirmationPacket | null;
/**
 * Get packet priority (higher = more important)
 */
export declare function getPacketPriority(packet: SteeringPacket): number;
/**
 * Serialize steering packet to JSON string
 */
export declare function serializePacket(packet: SteeringPacket): string;
/**
 * Deserialize steering packet from JSON string
 */
export declare function deserializePacket(json: string): SteeringPacket;
//# sourceMappingURL=steering.d.ts.map