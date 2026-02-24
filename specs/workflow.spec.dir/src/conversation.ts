/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/conversation, @workflow/conversation-example
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Parsed user intent types
 * 
 * @block:workflow/conversation @kind:entity
 */
export type IntentType =
  | 'start_feature'
  | 'extend_feature'
  | 'modify_config'
  | 'review_changes'
  | 'explain_spec'
  | 'fix_issue'
  | 'unknown';

/**
 * Parsed user command
 */
export interface ParsedCommand {
  intent: IntentType;
  confidence: number;
  entities: string[];
  rawInput: string;
  suggestedAction?: string;
}

/**
 * Command patterns for intent detection
 */
interface IntentPattern {
  intent: IntentType;
  patterns: RegExp[];
  entityExtractors: RegExp[];
}

/**
 * Intent patterns (from @workflow/conversation)
 */
const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'start_feature',
    patterns: [
      /\b(build|create|make|implement)\b.*\b(app|api|service|app|system)\b/i,
      /\b(build|create|make)\b.*\b(go|typescript|python|rust|java)\b/i,
      /\bstart\s+(a\s+)?(new\s+)?(project|feature)\b/i
    ],
    entityExtractors: [
      /\b(go|typescript|python|rust|java|react|node)\b/i,
      /\b(rest\s+)?api\b/i,
      /\b(app|application|service|system)\b/i
    ]
  },
  {
    intent: 'extend_feature',
    patterns: [
      /\b(add|extend|add\s+support\s+for)\b/i,
      /\benable\b/i,
      /\bimplement\b.*\b(feature|capability)\b/i
    ],
    entityExtractors: [
      /\b(password\s+reset|rate\s+limiting|auth|login|logout)\b/i,
      /\b(feature|capability)\b/i
    ]
  },
  {
    intent: 'modify_config',
    patterns: [
      /\b(use|switch|change|replace).*\b(sqlite|postgres|mysql|mongodb)\b/i,
      /\b(change|update|modify)\s+(config|setting)\b/i
    ],
    entityExtractors: [
      /\b(sqlite|postgres|postgresql|mysql|mongodb|redis)\b/i,
      /\bconfig|setting\b/i
    ]
  },
  {
    intent: 'review_changes',
    patterns: [
      /\b(show|what|list).*\b(changed|changes|diff)\b/i,
      /\bwhat\s+(did|has)\s+(we|been)\s+(changed|built)\b/i,
      /\breview\b/i
    ],
    entityExtractors: []
  },
  {
    intent: 'explain_spec',
    patterns: [
      /\b(explain|describe|what\s+is|understand)\b/i,
      /\bwhy\b/i
    ],
    entityExtractors: [
      /\b(spec|block)\b/i
    ]
  },
  {
    intent: 'fix_issue',
    patterns: [
      /\b(fix|bug|issue|problem|error|fail)\b/i,
      /\b(not\s+working|broken|wrong)\b/i
    ],
    entityExtractors: [
      /\b(login|auth|api|database|build)\b/i
    ]
  }
];

/**
 * Parse user command from natural language
 * 
 * @block:workflow/conversation @kind:code
 * 
 * Examples:
 * - "Build a Go API with auth" → start_feature
 * - "Add password reset" → extend_feature
 * - "Use PostgreSQL instead of SQLite" → modify_config
 * - "Show me what changed" → review_changes
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  
  // Try each intent pattern
  let bestMatch: IntentPattern | null = null;
  let highestScore = 0;
  
  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(trimmed)) {
        // Calculate confidence based on entity matches
        let entityScore = 0;
        for (const extractor of pattern.entityExtractors) {
          const matches = trimmed.match(extractor);
          if (matches) {
            entityScore += matches.length;
          }
        }
        
        const score = 1 + entityScore * 0.1;
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = pattern;
        }
      }
    }
  }
  
  // Extract entities
  const entities: string[] = [];
  if (bestMatch) {
    for (const extractor of bestMatch.entityExtractors) {
      const matches = trimmed.match(extractor);
      if (matches) {
        entities.push(...matches);
      }
    }
  }
  
  // Determine intent
  const intent = bestMatch?.intent || 'unknown';
  
  // Calculate confidence (0-1)
  const confidence = Math.min(highestScore / 2, 1);
  
  // Generate suggested action
  const suggestedAction = generateSuggestedAction(intent, entities, trimmed);
  
  return {
    intent,
    confidence,
    entities,
    rawInput: trimmed,
    suggestedAction
  };
}

/**
 * Generate suggested action based on intent
 */
function generateSuggestedAction(
  intent: IntentType,
  entities: string[],
  rawInput: string
): string {
  switch (intent) {
    case 'start_feature':
      return `Update project.scl to: "${rawInput}" and trigger cascade`;
    
    case 'extend_feature':
      return `Find relevant spec and add: "${entities.join(', ')}"`;
    
    case 'modify_config':
      return `Update configuration for: "${entities.join(', ')}"`;
    
    case 'review_changes':
      return 'Run: speclang status and show changes since last convergence';
    
    case 'explain_spec':
      return `Read and explain spec related to: "${entities.join(', ')}"`;
    
    case 'fix_issue':
      return `Analyze issue and update relevant spec`;
    
    default:
      return 'Ask user for clarification';
  }
}

/**
 * Execute parsed command
 */
export async function executeParsedCommand(
  command: ParsedCommand,
  projectPath: string
): Promise<string> {
  const { intent, entities, rawInput } = command;
  
  switch (intent) {
    case 'start_feature':
      return await handleStartFeature(rawInput, projectPath);
    
    case 'extend_feature':
      return await handleExtendFeature(entities, projectPath);
    
    case 'modify_config':
      return await handleModifyConfig(entities, projectPath);
    
    case 'review_changes':
      return handleReviewChanges(projectPath);
    
    case 'explain_spec':
      return handleExplainSpec(entities, projectPath);
    
    case 'fix_issue':
      return await handleFixIssue(entities, rawInput, projectPath);
    
    default:
      return 'I didn\'t understand that. Could you rephrase?';
  }
}

/**
 * Handle start feature intent
 */
async function handleStartFeature(description: string, projectPath: string): Promise<string> {
  // Update project.scl with the new feature request
  const northStarPath = path.join(projectPath, 'project.scl');
  
  if (!fs.existsSync(northStarPath)) {
    return 'Error: project.scl not found. Initialize project first: speclang init';
  }
  
  // Read existing north star
  let content = fs.readFileSync(northStarPath, 'utf-8');
  
  // Append the new feature request
  const separator = content.includes('##') ? '\n\n' : '\n';
  const featureBlock = `${separator}## New Feature\n\n${description}\n`;
  
  // Find position to insert (after existing content)
  const headerEnd = content.indexOf('---', content.indexOf('---') + 3);
  if (headerEnd > 0) {
    content = content.slice(0, headerEnd + 3) + featureBlock + content.slice(headerEnd + 3);
  } else {
    content += featureBlock;
  }
  
  fs.writeFileSync(northStarPath, content);
  
  return `I've added your request to project.scl:\n\n"${description}"\n\nThe cascade will now expand this into specs and generate code.`;
}

/**
 * Handle extend feature intent
 */
async function handleExtendFeature(entities: string[], projectPath: string): Promise<string> {
  // TODO: Find relevant spec and extend it
  return `I'll add "${entities.join(', ')}" to the relevant spec and trigger the cascade.`;
}

/**
 * Handle modify config intent
 */
async function handleModifyConfig(entities: string[], projectPath: string): Promise<string> {
  // TODO: Update configuration
  const configPath = path.join(projectPath, '.speclangrc');
  
  if (!fs.existsSync(configPath)) {
    return 'Error: .speclangrc not found';
  }
  
  return `I'll update the configuration for: "${entities.join(', ')}"`;
}

/**
 * Handle review changes intent
 */
function handleReviewChanges(projectPath: string): string {
  const { getChanges, formatChanges } = require('./review.js');
  const changes = getChanges(projectPath);
  return formatChanges(changes);
}

/**
 * Handle explain spec intent
 */
function handleExplainSpec(entities: string[], projectPath: string): string {
  if (entities.length === 0) {
    return 'Which spec would you like me to explain?';
  }
  
  const { showSpecDiff } = require('./review.js');
  const specId = entities[0];
  return showSpecDiff(specId, projectPath);
}

/**
 * Handle fix issue intent
 */
async function handleFixIssue(
  entities: string[],
  description: string,
  projectPath: string
): Promise<string> {
  // TODO: Analyze issue and find relevant spec
  return `I'll investigate and fix the issue related to: "${entities.join(', ')}"`;
}

/**
 * Process a user conversation turn
 * 
 * @block:workflow/conversation-example @kind:code
 */
export async function processConversation(
  userInput: string,
  projectPath: string
): Promise<string> {
  // Parse the command
  const parsed = parseCommand(userInput);
  
  console.log(`[Conversation] Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})`);
  
  // Execute based on intent
  return await executeParsedCommand(parsed, projectPath);
}
