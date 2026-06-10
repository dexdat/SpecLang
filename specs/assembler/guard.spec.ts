import type { ExtensionContext } from '@earendil-works/pi-coding-agent';

// ---- Ownership Rules ----

interface OwnershipRule {
  pattern: string;
  role: string;
  priority: number;
}

const DEFAULT_OWNERSHIP_RULES: OwnershipRule[] = [
  { pattern: 'project.scl', role: 'northstar', priority: 10 },
  { pattern: '**/*.test.spec.md', role: 'test-writer', priority: 6 },
  { pattern: 'specs/**/*.spec.md', role: 'spec-writer', priority: 5 },
  { pattern: 'specs/**/*.spec.{lang}.md', role: 'assembler', priority: 5 },
  { pattern: '**/*.spec.{lang}', role: 'codegen', priority: 5 },
  { pattern: 'build.yaml', role: 'pipeline', priority: 10 },
];

const USER_OVERRIDE = 'user'; // User sessions can write anywhere

// ---- Ownership Checker ----

export class OwnershipChecker {
  private rules: OwnershipRule[] = [...DEFAULT_OWNERSHIP_RULES];

  addRule(rule: OwnershipRule): void {
    this.rules.push(rule);
  }

  getOwner(filePath: string, headerOwnedBy?: string): string {
    // Header field always wins
    if (headerOwnedBy) return headerOwnedBy;

    // Pattern-based matching
    const matches = this.rules
      .filter((r) => this.matchPattern(filePath, r.pattern))
      .sort((a, b) => b.priority - a.priority);

    return matches.length > 0 ? matches[0].role : 'unknown';
  }

  canWrite(filePath: string, agentRole: string, headerOwnedBy?: string): boolean {
    if (agentRole === USER_OVERRIDE) return true;
    const owner = this.getOwner(filePath, headerOwnedBy);
    return owner === agentRole || owner === 'unknown';
  }

  private matchPattern(filePath: string, pattern: string): boolean {
    try {
      const { minimatch } = require('minimatch');
      // Replace {lang} placeholder which minimatch interprets as brace expansion
      const cleanPattern = pattern.replace(/\{lang\}/g, '*');
      return minimatch(filePath, cleanPattern);
    } catch {
      return false;
    }
  }
}

// ---- Custom Tool Definitions ----

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>, context: ExtensionContext) => Promise<unknown>;
}

const CUSTOM_TOOLS: ToolDefinition[] = [
  {
    name: 'create_spec_file',
    description: 'Create a new spec file with valid YAML front matter',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        headers: { type: 'object' },
        content: { type: 'string', default: '' },
      },
      required: ['filePath', 'headers'],
    },
    handler: async (params, ctx) => {
      const fs = await import('fs/promises');
      const headers = params.headers as Record<string, unknown>;
      let content = `---\n`;
      for (const [key, value] of Object.entries(headers)) {
        content += `${key}: ${JSON.stringify(value)}\n`;
      }
      content += `---\n\n${params.content || ''}`;
      await fs.writeFile(params.filePath as string, content, 'utf-8');
      return { success: true, filePath: params.filePath };
    },
  },
  {
    name: 'validate_specs',
    description: 'Validate spec headers and @ref: links',
    parameters: {
      type: 'object',
      properties: {
        specPath: { type: 'string' },
      },
      required: ['specPath'],
    },
    handler: async (params, ctx) => {
      const fs = await import('fs/promises');
      const content = await fs.readFile(params.specPath as string, 'utf-8');
      const match = content.match(/^---\n(.*?)\n---\n/s);
      if (!match) return { valid: false, errors: ['No valid YAML front matter found'] };
      try {
        const yaml = await import('js-yaml');
        const header = yaml.load(match[1]) as Record<string, unknown>;
        const errors: string[] = [];
        if (!header.id) errors.push('Missing required field: id');
        if (!header.version) errors.push('Missing required field: version');
        return { valid: errors.length === 0, errors };
      } catch (e) {
        return { valid: false, errors: [`YAML parse error: ${e}`] };
      }
    },
  },
  {
    name: 'check_ownership',
    description: 'Check which agent role owns a given file path',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
      },
      required: ['filePath'],
    },
    handler: async (params, ctx) => {
      const checker = new OwnershipChecker();
      return { owner: checker.getOwner(params.filePath as string) };
    },
  },
];

// ---- Extension Entry Point ----

export function registerGuardExtension(api: {
  registerTool: (name: string, def: ToolDefinition) => void;
  onToolCall: (handler: (call: unknown) => boolean | Promise<boolean>) => void;
}): void {
  // Register custom tools
  for (const tool of CUSTOM_TOOLS) {
    api.registerTool(tool.name, tool);
  }

  // Register onToolCall interceptor for ownership check
  api.onToolCall(async (call: any) => {
    if (call.toolName === 'write_file' || call.toolName === 'edit_file') {
      const filePath = call.parameters?.filePath || call.parameters?.path;
      if (filePath) {
        const checker = new OwnershipChecker();
        const agentRole = call.context?.agentRole || 'unknown';
        if (!checker.canWrite(filePath, agentRole)) {
          console.warn(`[guard] BLOCKED: ${agentRole} cannot write ${filePath}`);
          return false; // Block the write
        }
      }
    }
    return true; // Allow
  });
}
