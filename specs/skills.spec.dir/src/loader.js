"use strict";
// SPECLANG-GENERATED
// Source: @speclang/skills
// DO NOT EDIT MANUALLY
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillLoader = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
class SkillLoader {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    async loadDirectory(dir) {
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
    async loadFile(filepath) {
        const content = await fs.readFile(filepath, 'utf-8');
        return this.parseSkill(content, filepath);
    }
    parseSkill(content, filepath) {
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
    parseTriggers(triggers) {
        return triggers.map(t => {
            const parts = t.split(':');
            return {
                event: parts[0],
                pattern: parts[1]
            };
        });
    }
    parsePrompts(body) {
        const prompts = {};
        const sections = body.split(/^# /m).filter(Boolean);
        for (const section of sections) {
            const lines = section.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();
            prompts[title] = content;
        }
        return prompts;
    }
    parseExamples(body) {
        const examples = [];
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
exports.SkillLoader = SkillLoader;
//# sourceMappingURL=loader.js.map