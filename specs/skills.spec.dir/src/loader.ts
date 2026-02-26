// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import type { Skill, SkillTrigger, SkillExample } from './types';
import { SkillRegistry } from './registry';

export class SkillLoader {
  private registry: SkillRegistry;
  
  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }
  
  async loadDirectory(dir: string): Promise<number> {
    let count = 0;
    
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const skill = await this.loadFile(path.join(dir, file));
        if (skill) {
          this.registry.register(skill);
          count++;
        }
      }
    }
    
    return count;
  }
  
  async loadFile(filepath: string): Promise<Skill | null> {
    const content = await fs.readFile(filepath, 'utf-8');
    return this.parseSkill(content, filepath);
  }
  
  private parseSkill(content: string, filepath: string): Skill | null {
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.warn(`[skills] Invalid skill file: ${filepath}`);
      return null;
    }
    
    const [, frontmatter, body] = frontmatterMatch;
    const meta = yaml.parse(frontmatter);
    
    // Parse prompts from body
    const prompts = this.parsePrompts(body);
    const systemPrompt = prompts['System Prompt'] || prompts['System'] || '';
    
    return {
      name: meta.name || path.basename(filepath, '.md'),
      description: meta.description || '',
      version: meta.version || '0.1.0',
      triggers: this.parseTriggers(meta.triggers || []),
      owns: meta.owns || [],
      priority: meta.priority || 0,
      systemPrompt,
      prompts,
      tools: meta.tools,
      examples: this.parseExamples(body)
    };
  }
  
  private parseTriggers(triggers: string[]): SkillTrigger[] {
    return triggers.map(t => {
      const parts = t.split(':');
      return {
        event: parts[0] as SkillTrigger['event'],
        pattern: parts[1]
      };
    });
  }
  
  private parsePrompts(body: string): Record<string, string> {
    const prompts: Record<string, string> = {};
    const sections = body.split(/^# /m).filter(Boolean);
    
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      prompts[title] = content;
    }
    
    return prompts;
  }
  
  private parseExamples(body: string): SkillExample[] {
    const examples: SkillExample[] = [];
    const exampleRegex = /## Example: (.+)\n```[\s\S]*?Input:\n([\s\S]*?)\nOutput:\n([\s\S]*?)```/g;
    
    let match;
    while ((match = exampleRegex.exec(body)) !== null) {
      examples.push({
        name: match[1],
        input: match[2].trim(),
        output: match[3].trim()
      });
    }
    
    return examples;
  }
}