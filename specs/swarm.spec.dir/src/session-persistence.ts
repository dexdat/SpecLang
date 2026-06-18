export type ContextTier = 'cold' | 'warm' | 'compact' | 'self-serve';

export interface ContextState {
  tier: ContextTier;
  currentContent: string;
  history: string[];
  diffPatterns: string[];
  deps: string[];
}

export interface SessionPersistenceStats {
  coldStarts: number;
  warmReuses: number;
  compactions: number;
  selfServe: number;
  flappingEvents: number;
  convergences: number;
}

export class ContextManager {
  private coldStarts = 0;
  private warmReuses = 0;
  private compactions = 0;
  private selfServe = 0;
  private flappingEvents = 0;
  private convergences = 0;

  constructor(private maxContextLength: number = 8000) {}

  buildColdStart(filePath: string, content: string, deps: string[]): ContextState {
    this.coldStarts++;
    const depsBlock = deps.length > 0
      ? `\n\n## Dependencies\n${deps.map(d => `- ${d}`).join('\n')}`
      : '';
    const fullContent = `## File: ${filePath}\n${content}${depsBlock}`;
    return {
      tier: 'cold',
      currentContent: fullContent,
      history: [],
      diffPatterns: [],
      deps,
    };
  }

  buildWarmUpdate(existingState: ContextState, diff: string): { content: string; state: ContextState } {
    this.warmReuses++;
    const warmContent = `${existingState.currentContent}\n\n## Incremental Update\n${diff}`;
    const newState: ContextState = {
      ...existingState,
      tier: 'warm',
      currentContent: warmContent,
      history: [...existingState.history, existingState.currentContent],
      diffPatterns: [...existingState.diffPatterns, diff],
    };
    return { content: warmContent, state: newState };
  }

  buildCompactUpdate(existingState: ContextState, diff: string): { content: string; state: ContextState } {
    this.compactions++;
    const appliedCount = existingState.history.length + 1;
    const depsLine = existingState.deps.length > 0
      ? existingState.deps.join(', ')
      : 'none';

    const summary = `## Compact Session State\n- Total updates applied: ${appliedCount}\n- Dependencies: ${depsLine}\n- Current tier: compact\n\n## Key Context Summary\n${existingState.currentContent.slice(0, Math.min(500, existingState.currentContent.length))}`;
    const compactContent = `${summary}\n\n## Latest Change\n${diff}`;

    const newState: ContextState = {
      ...existingState,
      tier: 'compact',
      currentContent: compactContent,
      history: [...existingState.history, existingState.currentContent],
      diffPatterns: [...existingState.diffPatterns, diff],
    };
    return { content: compactContent, state: newState };
  }

  buildSelfServeUpdate(existingState: ContextState, diff: string): { content: string; state: ContextState } {
    this.selfServe++;
    const changedFiles = diff
      .split('\n')
      .filter(l => l.startsWith('diff --git'))
      .map(l => l.replace('diff --git ', '').split(' ')[0])
      .join(', ');

    const selfServeContent = `## Self-Serve Update\nContext window full. Files changed:\n${changedFiles || '(unknown)'}\n\nPlease use read() to fetch current state.\n\nTotal updates so far: ${existingState.history.length + 1}`;

    const newState: ContextState = {
      ...existingState,
      tier: 'self-serve',
      currentContent: selfServeContent,
      history: [...existingState.history, existingState.currentContent],
      diffPatterns: [...existingState.diffPatterns, diff],
    };
    return { content: selfServeContent, state: newState };
  }

  selectTier(existingState: ContextState): ContextTier {
    const len = existingState.currentContent.length;
    if (len < this.maxContextLength * 0.5) return 'warm';
    if (len < this.maxContextLength * 0.85) return 'compact';
    return 'self-serve';
  }

  isFlapping(state: ContextState): boolean {
    if (state.diffPatterns.length < 3) return false;
    const lastDiff = state.diffPatterns[state.diffPatterns.length - 1];
    const count = state.diffPatterns.filter(d => d === lastDiff).length;
    if (count >= 3) {
      this.flappingEvents++;
      return true;
    }
    return false;
  }

  shouldCloseOnConvergence(state: ContextState, quietMs: number): boolean {
    if (state.tier === 'cold') return false;
    if (state.diffPatterns.length < 3) return false;
    const lastThree = state.diffPatterns.slice(-3);
    if (lastThree.every(d => d === lastThree[0])) {
      this.convergences++;
      return true;
    }
    return false;
  }

  getStats(): SessionPersistenceStats {
    return {
      coldStarts: this.coldStarts,
      warmReuses: this.warmReuses,
      compactions: this.compactions,
      selfServe: this.selfServe,
      flappingEvents: this.flappingEvents,
      convergences: this.convergences,
    };
  }
}
