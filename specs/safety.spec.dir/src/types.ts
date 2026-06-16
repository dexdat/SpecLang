/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/safety.spec.dir/src/types.spec.md
 * Generated: 2026-03-21
 * 
 * Edit the spec, not this file.
 */

export interface Spec {
  id: string;
  metadata: {
    agent_support: 'human_only' | 'agent_assisted' | 'agent_autonomous';
    project_level?: string;
    tags?: string[];
  };
}

export interface ConfidenceScore {
  score: number;
  factors: {
    historicalReliability: number;
    authorReputation: number;
    similarityToGood: number;
    testCoverage: number;
    reviewStatus: number;
  };
}

export interface Database {
  run(query: string, ...params: any[]): Promise<void>;
}