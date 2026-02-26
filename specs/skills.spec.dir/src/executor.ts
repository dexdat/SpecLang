/**
speclang-header lines:5
id: @specs/skills
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY

import type { Skill, SkillContext, SkillEvent, SkillResult } from './types';
import { SkillRegistry } from './registry';

export class SkillExecutor {
  private registry: SkillRegistry;
  
  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }
  
  async execute(skillName: string, context: SkillContext): Promise<SkillResult> {
    const skill = this.registry.get(skillName);
    if (!skill) {
      return { success: false, message: `Skill not found: ${skillName}` };
    }
    
    console.log(`[executor] Executing: ${skillName}`);
    
    // Build prompt
    const prompt = this.buildPrompt(skill, context);
    
    // Execute skill (would integrate with AI)
    // For now, return structured result
    return {
      success: true,
      message: `Skill ${skillName} executed`,
      filesModified: [],
      nextActions: []
    };
  }
  
  async executeForEvent(event: SkillEvent, context: SkillContext): Promise<SkillResult[]> {
    const skills = this.registry.getByTrigger(event);
    
    if (skills.length === 0) {
      return [];
    }
    
    // Sort by priority
    skills.sort((a, b) => b.priority - a.priority);
    
    // Execute skills in order
    const results: SkillResult[] = [];
    for (const skill of skills) {
      // Check ownership
      if (skill.owns.length > 0 && event.path) {
        const owned = skill.owns.some(pattern => 
          this.matchPattern(event.path!, pattern)
        );
        if (!owned) {
          continue;
        }
      }
      
      const result = await this.execute(skill.name, context);
      results.push(result);
      
      // Stop on failure if high priority
      if (!result.success && skill.priority >= 100) {
        break;
      }
    }
    
    return results;
  }
  
  private buildPrompt(skill: Skill, context: SkillContext): string {
    let prompt = skill.systemPrompt;
    
    // Add context
    prompt += `\n\n## Context\n`;
    prompt += `- Event: ${context.event.type}\n`;
    if (context.event.path) {
      prompt += `- File: ${context.event.path}\n`;
    }
    if (context.event.content) {
      prompt += `\n### File Content\n\`\`\`\n${context.event.content}\n\`\`\`\n`;
    }
    
    // Add available prompts
    for (const [name, content] of Object.entries(skill.prompts)) {
      if (name !== 'System Prompt' && name !== 'System') {
        prompt += `\n\n## ${name}\n${content}`;
      }
    }
    
    return prompt;
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }
}