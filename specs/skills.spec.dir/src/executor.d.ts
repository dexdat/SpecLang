import type { SkillContext, SkillEvent, SkillResult } from './types';
import { SkillRegistry } from './registry';
export declare class SkillExecutor {
    private registry;
    constructor(registry: SkillRegistry);
    execute(skillName: string, context: SkillContext): Promise<SkillResult>;
    executeForEvent(event: SkillEvent, context: SkillContext): Promise<SkillResult[]>;
    private buildPrompt;
    private matchPattern;
}
//# sourceMappingURL=executor.d.ts.map