// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY

/**
 * Skill Types
 */

// Placeholder types for dependencies
export type Session = any;
export type Database = any;
export type Config = any;

export interface Skill {
  name: string;
  description: string;
  version: string;
  triggers: SkillTrigger[];
  owns: string[];
  priority: number;
  systemPrompt: string;
  prompts: Record<string, string>;
  tools?: string[];
  examples?: SkillExample[];
}

export interface SkillTrigger {
  event: 'file.edited' | 'file.created' | 'file.deleted' | 'agent.finished' | 'convergence' | 'user.command';
  pattern?: string;
  condition?: string;
}

export interface SkillExample {
  name: string;
  input: string;
  output: string;
}

export interface SkillContext {
  event: SkillEvent;
  session: Session;
  db: Database;
  config: Config;
}

export interface SkillEvent {
  type: string;
  path?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface SkillResult {
  success: boolean;
  message: string;
  filesModified?: string[];
  nextActions?: string[];
}

export type SkillExecutorFn = (context: SkillContext) => Promise<SkillResult>;