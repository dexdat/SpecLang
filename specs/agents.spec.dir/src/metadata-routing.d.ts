/**
 * Metadata-based routing for agent behavior
 *
 * Generated from: @speclang/agent-protocol/sessions
 */
import { SpecMetadata, MetadataRouting, AgentSupportLevel, ProjectLevel } from './types';
export declare function createMetadataRouting(): MetadataRouting;
export declare function parseProjectLevel(value: string | undefined): ProjectLevel;
export declare function parseAgentSupport(value: string | undefined): AgentSupportLevel;
export declare function extractMetadataFromHeader(header: Record<string, unknown>): SpecMetadata;
//# sourceMappingURL=metadata-routing.d.ts.map