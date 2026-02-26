/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @speclang/cascade/triggers
// Trigger routing logic - determines which agents to invoke

import { 
  Trigger, 
  TriggerSourceConfig, 
  RoutingResult, 
  AgentRegistry,
  TriggerPriority 
} from './types';
import { identifyTriggerSource, matchPattern } from './sources';

/**
 * Trigger router - determines which agents should respond to a trigger
 */
export class TriggerRouter {
  private agentRegistry: AgentRegistry;
  
  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
  }
  
  /**
   * Route a trigger to the appropriate agents
   */
  route(trigger: Trigger): RoutingResult {
    const sourceConfig = identifyTriggerSource(trigger.file);
    
    if (!sourceConfig) {
      return { 
        agents: [], 
        priority: 'low', 
        starts_cascade: false 
      };
    }
    
    // Determine target agents
    const agents = this.determineAgents(trigger, sourceConfig);
    
    return {
      agents,
      priority: sourceConfig.priority,
      starts_cascade: sourceConfig.starts_cascade || false
    };
  }
  
  /**
   * Determine which agents should handle this trigger
   */
  private determineAgents(
    trigger: Trigger, 
    config: TriggerSourceConfig
  ): string[] {
    // Use configured triggers if available
    if (config.triggers && config.triggers.length > 0) {
      return config.triggers;
    }
    
    // Dynamic routing based on file type and content
    if (this.isSpecFile(trigger.file)) {
      return ['speclang-spec-writer', 'speclang-code-gen'];
    }
    
    if (this.isGeneratedFile(trigger.file)) {
      return ['speclang-test-writer'];
    }
    
    if (this.isTestFile(trigger.file)) {
      return ['speclang-test-runner'];
    }
    
    // Fallback: query registry for agents that own similar files
    return this.agentRegistry.getAgentsForFile(trigger.file);
  }
  
  /**
   * Check if file is a spec file
   */
  private isSpecFile(filePath: string): boolean {
    return (
      filePath.endsWith('.scl') || 
      filePath.includes('.spec.') ||
      filePath.endsWith('.spec.md') ||
      filePath.endsWith('.spec.yaml') ||
      filePath.endsWith('.spec.yml')
    );
  }
  
  /**
   * Check if file is a generated file
   */
  private isGeneratedFile(filePath: string): boolean {
    return filePath.startsWith('generated/');
  }
  
  /**
   * Check if file is a test file
   */
  private isTestFile(filePath: string): boolean {
    return (
      filePath.startsWith('tests/') ||
      filePath.includes('_test.') ||
      filePath.includes('.test.') ||
      filePath.includes('.spec.scl') && filePath.includes('test')
    );
  }
  
  /**
   * Get priority for a trigger
   */
  getPriority(trigger: Trigger): TriggerPriority {
    const config = identifyTriggerSource(trigger.file);
    return config?.priority || 'low';
  }
  
  /**
   * Check if trigger starts a new cascade
   */
  startsCascade(trigger: Trigger): boolean {
    const config = identifyTriggerSource(trigger.file);
    return config?.starts_cascade || false;
  }
}

/**
 * Create a simple in-memory agent registry for testing
 */
export class InMemoryAgentRegistry implements AgentRegistry {
  private agents: Map<string, AgentInfo> = new Map();
  
  constructor(agents: AgentInfo[] = []) {
    for (const agent of agents) {
      this.agents.set(agent.name, agent);
    }
  }
  
  getAgentsForFile(filePath: string): string[] {
    const matching: string[] = [];
    
    this.agents.forEach((agent, name) => {
      for (const pattern of agent.owned_files) {
        if (matchPattern(filePath, pattern)) {
          matching.push(name);
          break;
        }
      }
    });
    
    return matching;
  }
  
  getAgentByName(name: string): AgentInfo | null {
    return this.agents.get(name) || null;
  }
  
  listAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }
  
  registerAgent(agent: AgentInfo): void {
    this.agents.set(agent.name, agent);
  }
}

/**
 * Simple glob matching for registry
 */
function matchGlob(filePath: string, pattern: string): boolean {
  if (pattern === '**/*') return true;
  
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return filePath.startsWith(prefix);
  }
  
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(filePath);
  }
  
  return filePath === pattern;
}

// Re-export types for convenience
import { AgentInfo } from './types';
