import { readFileSync, existsSync } from 'fs';
import { join, isAbsolute } from 'path';

const DEFAULT_SKILLS_BASE_DIR = 'specs/skills.spec.dir';
const DEFAULT_TIMEOUT_MS = 600000;

export interface SessionHandle {
  sessionId: string;
  cascadeId: string;
  filePath: string;
  agentType: string;
  spawnedAt: number;
}

export interface SessionManagerStats {
  activeCount: number;
  totalSpawned: number;
  totalDisposed: number;
}

export interface SessionManagerOptions {
  timeoutMs?: number;
  skillsBaseDir?: string;
}

interface PiAgentSession {
  prompt(message: string): Promise<void>;
  dispose(): void;
}

let _createAgentSession: ((opts: Record<string, unknown>) => Promise<{ session: PiAgentSession }>) | null = null;

async function getCreateAgentSession(): Promise<typeof _createAgentSession> {
  if (_createAgentSession) return _createAgentSession;
  try {
    const mod = await import('@earendil-works/pi-coding-agent') as { createAgentSession: typeof _createAgentSession };
    if (typeof mod.createAgentSession !== 'function') {
      throw new Error('createAgentSession is not a function');
    }
    _createAgentSession = mod.createAgentSession;
  } catch {
    _createAgentSession = async () => ({
      session: {
        prompt: async () => {},
        dispose: () => {},
      },
    });
  }
  return _createAgentSession;
}

export function _resetPiSdkCache(): void {
  _createAgentSession = null;
}

export class SessionManager {
  private activeSessions: Map<string, PiAgentSession>;
  private activeHandles: Map<string, SessionHandle>;
  private activeTimeouts: Map<string, NodeJS.Timeout>;
  private skillsBaseDir: string;
  private timeoutMs: number;
  private cascadeCounter: number;
  private totalSpawned: number;
  private totalDisposed: number;

  constructor(options?: SessionManagerOptions) {
    this.activeSessions = new Map();
    this.activeHandles = new Map();
    this.activeTimeouts = new Map();
    this.skillsBaseDir = options?.skillsBaseDir ?? DEFAULT_SKILLS_BASE_DIR;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.cascadeCounter = 0;
    this.totalSpawned = 0;
    this.totalDisposed = 0;
  }

  async spawnSession(params: {
    filePath: string;
    agentType: string;
    skillPath: string;
    cascadeId?: string;
  }): Promise<SessionHandle> {
    const { filePath, agentType, skillPath, cascadeId } = params;

    if (this.activeSessions.has(filePath)) {
      return this.activeHandles.get(filePath)!;
    }

    const skillContent = this.loadSkillPrompt(skillPath);
    const resolvedCascadeId = cascadeId ?? this.generateCascadeId();

    let specContent = '';
    try {
      const specFilePath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
      if (existsSync(specFilePath)) {
        specContent = readFileSync(specFilePath, 'utf-8');
      }
    } catch {
      // Spec file not available
    }

    const fullPrompt = skillContent
      ? `## Skill Context\n${skillContent}\n\n## Spec File: ${filePath}\n${specContent}`
      : `## Spec File: ${filePath}\n${specContent}`;

    const createSession = await getCreateAgentSession();
    const { session } = await createSession({
      model: 'deepseek/deepseek-v4-flash',
      cwd: process.cwd(),
      prompt: fullPrompt,
      tools: ['read', 'edit', 'write', 'bash', 'glob'],
    });

    this.activeSessions.set(filePath, session);
    this.totalSpawned++;

    const handle: SessionHandle = {
      sessionId: `${filePath}@${Date.now()}`,
      cascadeId: resolvedCascadeId,
      filePath,
      agentType,
      spawnedAt: Date.now(),
    };

    this.activeHandles.set(filePath, handle);

    const timeout = setTimeout(() => {
      this.disposeSession(filePath).catch(() => {});
    }, this.timeoutMs);
    this.activeTimeouts.set(filePath, timeout);

    return handle;
  }

  getSession(filePath: string): PiAgentSession | undefined {
    return this.activeSessions.get(filePath);
  }

  async disposeSession(filePath: string): Promise<void> {
    if (!this.activeSessions.has(filePath)) return;

    const timeout = this.activeTimeouts.get(filePath);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTimeouts.delete(filePath);
    }

    const session = this.activeSessions.get(filePath)!;
    session.dispose();

    this.activeSessions.delete(filePath);
    this.activeHandles.delete(filePath);
    this.totalDisposed++;
  }

  async disposeAll(): Promise<void> {
    const filePaths = Array.from(this.activeSessions.keys());
    for (const fp of filePaths) {
      await this.disposeSession(fp);
    }
  }

  getStats(): SessionManagerStats {
    return {
      activeCount: this.activeSessions.size,
      totalSpawned: this.totalSpawned,
      totalDisposed: this.totalDisposed,
    };
  }

  private generateCascadeId(): string {
    this.cascadeCounter++;
    return `cascade-${this.cascadeCounter}`;
  }

  private loadSkillPrompt(skillPath: string): string {
    const fullPath = join(this.skillsBaseDir, skillPath);
    if (existsSync(fullPath)) {
      try {
        return readFileSync(fullPath, 'utf-8');
      } catch (err) {
        console.warn(`Failed to read skill file: ${fullPath}`);
      }
    } else {
      console.warn(`Skill file not found: ${fullPath}`);
    }
    return '';
  }
}
