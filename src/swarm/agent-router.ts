import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface AgentRoute {
  agentType: string;
  skillPath: string;
  ownershipPattern: string;
}

export interface RouterOptions {
  skillsBaseDir?: string;
}

const DEFAULT_SKILLS_BASE_DIR = 'specs/skills.spec.dir';

interface RouteEntry {
  test: RegExp;
  agentType: string;
  ownershipPattern: string;
}

const ROUTES: RouteEntry[] = [
  { test: /^specs\/.*\.spec\.(md|yaml)$/, agentType: 'spec-writer', ownershipPattern: 'specs/**/*.spec.{md,yaml,scl}' },
  { test: /\.scl$/, agentType: 'spec-writer', ownershipPattern: 'specs/**/*.spec.{md,yaml,scl}' },
  { test: /^generated\/.*\.go$/, agentType: 'code-gen-go', ownershipPattern: 'generated/**/*.go' },
  { test: /^generated\/.*\.ts$/, agentType: 'code-gen-ts', ownershipPattern: 'generated/**/*.ts' },
  { test: /^generated\/.*\.py$/, agentType: 'code-gen-py', ownershipPattern: 'generated/**/*.py' },
  { test: /^generated\/.*\.rs$/, agentType: 'code-gen-rs', ownershipPattern: 'generated/**/*.rs' },
  { test: /^generated\/.*\.(go|ts|py|rs)$/, agentType: 'code-gen', ownershipPattern: 'generated/**/*.{go,ts,py,rs}' },
  { test: /^tests\/.*\.test\.spec\./, agentType: 'test-writer', ownershipPattern: 'tests/**/*.test.spec.*' },
];

const SKILL_PATHS: Record<string, string> = {
  'spec-writer': 'spec-writer.spec.md',
  'code-gen': 'code-gen.spec.md',
  'code-gen-go': 'go/spec-writer.spec.md',
  'code-gen-ts': 'typescript/spec-writer.spec.md',
  'code-gen-py': 'python/spec-writer.spec.md',
  'code-gen-rs': 'rust/spec-writer-rust.spec.md',
  'test-writer': 'test-writer.spec.md',
};

export class AgentRouter {
  private skillsBaseDir: string;
  private promptCache: Map<string, string> = new Map();

  constructor(options?: RouterOptions) {
    this.skillsBaseDir = options?.skillsBaseDir ?? DEFAULT_SKILLS_BASE_DIR;
  }

  route(filePath: string): AgentRoute {
    for (const route of ROUTES) {
      if (route.test.test(filePath)) {
        return {
          agentType: route.agentType,
          skillPath: this.resolveSkillPath(route.agentType),
          ownershipPattern: route.ownershipPattern,
        };
      }
    }

    return {
      agentType: 'spec-writer',
      skillPath: this.resolveSkillPath('spec-writer'),
      ownershipPattern: 'specs/**/*.spec.{md,yaml,scl}',
    };
  }

  getSkillPrompt(agentType: string): string {
    const cached = this.promptCache.get(agentType);
    if (cached !== undefined) return cached;

    const skillPath = this.resolveSkillPath(agentType);
    const fullPath = join(this.skillsBaseDir, skillPath);

    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        this.promptCache.set(agentType, content);
        return content;
      } catch (err) {
        console.warn(`Warning: Failed to read skill file: ${fullPath}`);
      }
    } else {
      console.warn(`Warning: Skill file not found: ${fullPath}`);
    }

    this.promptCache.set(agentType, '');
    return '';
  }

  getOwnershipPattern(agentType: string): string {
    const route = ROUTES.find(r => r.agentType === agentType);
    if (route) return route.ownershipPattern;
    if (agentType === 'spec-writer') return 'specs/**/*.spec.{md,yaml,scl}';
    return '';
  }

  private resolveSkillPath(agentType: string): string {
    return SKILL_PATHS[agentType] ?? SKILL_PATHS['spec-writer'];
  }
}
