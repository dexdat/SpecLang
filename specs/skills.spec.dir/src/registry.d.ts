import type { Skill, SkillEvent } from './types';
export declare class SkillRegistry {
    private skills;
    private triggers;
    register(skill: Skill): void;
    unregister(name: string): void;
    get(name: string): Skill | undefined;
    getByTrigger(event: SkillEvent): Skill[];
    private getTriggerKey;
    private matchPattern;
}
//# sourceMappingURL=registry.d.ts.map