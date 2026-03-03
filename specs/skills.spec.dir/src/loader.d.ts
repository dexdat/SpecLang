import type { Skill } from './types';
import { SkillRegistry } from './registry';
export declare class SkillLoader {
    private registry;
    constructor(registry: SkillRegistry);
    loadDirectory(dir: string): Promise<number>;
    loadFile(filepath: string): Promise<Skill | null>;
    private parseSkill;
    private parseTriggers;
    private parsePrompts;
    private parseExamples;
}
//# sourceMappingURL=loader.d.ts.map