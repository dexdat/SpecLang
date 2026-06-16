"use strict";
// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillRegistry = void 0;
class SkillRegistry {
    skills = new Map();
    triggers = new Map();
    register(skill) {
        this.skills.set(skill.name, skill);
        // Index by triggers
        for (const trigger of skill.triggers) {
            const key = this.getTriggerKey(trigger);
            if (!this.triggers.has(key)) {
                this.triggers.set(key, []);
            }
            this.triggers.get(key).push(skill);
        }
        console.log(`[skills] Registered: ${skill.name}`);
    }
    unregister(name) {
        const skill = this.skills.get(name);
        if (!skill)
            return;
        // Remove from trigger index
        for (const trigger of skill.triggers) {
            const key = this.getTriggerKey(trigger);
            const skills = this.triggers.get(key);
            if (skills) {
                const idx = skills.findIndex(s => s.name === name);
                if (idx >= 0)
                    skills.splice(idx, 1);
            }
        }
        this.skills.delete(name);
    }
    get(name) {
        return this.skills.get(name);
    }
    getByTrigger(event) {
        const key = event.type;
        const skills = this.triggers.get(key) || [];
        // Filter by pattern
        return skills.filter(skill => {
            for (const trigger of skill.triggers) {
                if (trigger.event !== event.type)
                    continue;
                if (trigger.pattern && event.path) {
                    if (!this.matchPattern(event.path, trigger.pattern))
                        continue;
                }
                return true;
            }
            return false;
        });
    }
    getTriggerKey(trigger) {
        return trigger.event;
    }
    matchPattern(path, pattern) {
        // Convert glob pattern to regex
        const regex = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        return new RegExp(`^${regex}$`).test(path);
    }
}
exports.SkillRegistry = SkillRegistry;
//# sourceMappingURL=registry.js.map