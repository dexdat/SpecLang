/**
speclang-header lines:5
id: @specs/skills
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY

import type { Skill, SkillEvent, SkillTrigger } from './types';

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private triggers: Map<string, Skill[]> = new Map();
  
  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
    
    // Index by triggers
    for (const trigger of skill.triggers) {
      const key = this.getTriggerKey(trigger);
      if (!this.triggers.has(key)) {
        this.triggers.set(key, []);
      }
      this.triggers.get(key)!.push(skill);
    }
    
    console.log(`[skills] Registered: ${skill.name}`);
  }
  
  unregister(name: string): void {
    const skill = this.skills.get(name);
    if (!skill) return;
    
    // Remove from trigger index
    for (const trigger of skill.triggers) {
      const key = this.getTriggerKey(trigger);
      const skills = this.triggers.get(key);
      if (skills) {
        const idx = skills.findIndex(s => s.name === name);
        if (idx >= 0) skills.splice(idx, 1);
      }
    }
    
    this.skills.delete(name);
  }
  
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }
  
  getByTrigger(event: SkillEvent): Skill[] {
    const key = event.type;
    const skills = this.triggers.get(key) || [];
    
    // Filter by pattern
    return skills.filter(skill => {
      for (const trigger of skill.triggers) {
        if (trigger.event !== event.type) continue;
        if (trigger.pattern && event.path) {
          if (!this.matchPattern(event.path, trigger.pattern)) continue;
        }
        return true;
      }
      return false;
    });
  }
  
  private getTriggerKey(trigger: SkillTrigger): string {
    return trigger.event;
  }
  
  private matchPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regex}$`).test(path);
  }
}