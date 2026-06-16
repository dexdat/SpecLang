/**
 * SPECLANG-GENERATED: Agent suggestions for agent-assisted mode
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

import { Suggestion, SuggestionType, SuggestionPriority } from './types';

/**
 * Suggestion template for generating suggestions
 */
interface SuggestionTemplate {
  type: SuggestionType;
  content: string;
  confidence: number;
  priority: SuggestionPriority;
  conditions?: string[];
}

/**
 * Action interface for suggestion engine
 */
interface Action {
  id: string;
  type: string;
  resource: string;
  description: string;
  breaking?: boolean;
}

/**
 * Selected suggestions result
 */
interface SelectedSuggestions {
  selected: string[];
  rejected: string[];
  modified: Map<string, string>;
}

/**
 * Suggestion engine for agent-assisted mode
 */
export class SuggestionEngine {
  private suggestionTemplates: Map<string, SuggestionTemplate[]>;

  constructor() {
    this.suggestionTemplates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize suggestion templates for different action types
   */
  private initializeTemplates(): void {
    // Feature implementation suggestions
    this.suggestionTemplates.set('feature', [
      {
        type: 'implementation_approach',
        content: 'Break down into smaller, testable increments',
        confidence: 0.9,
        priority: 'high'
      },
      {
        type: 'test_strategy',
        content: 'Write tests before implementation (TDD)',
        confidence: 0.85,
        priority: 'high'
      },
      {
        type: 'optimization',
        content: 'Consider performance implications early',
        confidence: 0.7,
        priority: 'medium'
      }
    ]);

    // Refactoring suggestions
    this.suggestionTemplates.set('refactor', [
      {
        type: 'code_pattern',
        content: 'Ensure backward compatibility',
        confidence: 0.9,
        priority: 'high'
      },
      {
        type: 'test_strategy',
        content: 'Run existing tests before and after',
        confidence: 0.95,
        priority: 'high'
      },
      {
        type: 'optimization',
        content: 'Document any API changes',
        confidence: 0.8,
        priority: 'medium'
      }
    ]);

    // Bug fix suggestions
    this.suggestionTemplates.set('fix', [
      {
        type: 'implementation_approach',
        content: 'Reproduce the bug before fixing',
        confidence: 0.95,
        priority: 'high'
      },
      {
        type: 'test_strategy',
        content: 'Add regression test for this bug',
        confidence: 0.9,
        priority: 'high'
      },
      {
        type: 'code_pattern',
        content: 'Check for similar issues in codebase',
        confidence: 0.7,
        priority: 'low'
      }
    ]);

    // Code generation suggestions
    this.suggestionTemplates.set('generate_draft_code', [
      {
        type: 'implementation_approach',
        content: 'Generate minimal working code first',
        confidence: 0.85,
        priority: 'high'
      },
      {
        type: 'code_pattern',
        content: 'Follow project coding conventions',
        confidence: 0.9,
        priority: 'high'
      },
      {
        type: 'test_strategy',
        content: 'Generate accompanying tests',
        confidence: 0.8,
        priority: 'medium'
      }
    ]);

    // Read/suggest actions
    this.suggestionTemplates.set('read_spec', [
      {
        type: 'implementation_approach',
        content: 'Review related specs for context',
        confidence: 0.8,
        priority: 'medium'
      }
    ]);

    this.suggestionTemplates.set('suggest_improvements', [
      {
        type: 'implementation_approach',
        content: 'Be specific with improvement suggestions',
        confidence: 0.85,
        priority: 'medium'
      }
    ]);
  }

  /**
   * Generate suggestions for an action
   */
  async generateSuggestions(action: Action): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Get action-specific suggestions
    const templates = this.suggestionTemplates.get(action.type) || [];
    for (const template of templates) {
      const suggestion = await this.applyTemplate(template, action);
      suggestions.push(suggestion);
    }

    // Add contextual suggestions based on project patterns
    suggestions.push(...await this.getContextualSuggestions(action));

    // Sort by confidence and priority
    return suggestions.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Present suggestions in the requested format
   */
  async presentSuggestions(
    suggestions: Suggestion[],
    format: 'list' | 'interactive'
  ): Promise<SelectedSuggestions> {
    if (format === 'list') {
      return this.formatAsList(suggestions);
    }
    return this.formatAsInteractive(suggestions);
  }

  /**
   * Add a custom suggestion template
   */
  addTemplate(actionType: string, template: SuggestionTemplate): void {
    const existing = this.suggestionTemplates.get(actionType) || [];
    existing.push(template);
    this.suggestionTemplates.set(actionType, existing);
  }

  /**
   * Get all templates
   */
  getTemplates(): Map<string, SuggestionTemplate[]> {
    return new Map(this.suggestionTemplates);
  }

  private async applyTemplate(
    template: SuggestionTemplate,
    action: Action
  ): Promise<Suggestion> {
    return {
      id: `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      content: this.interpolate(template.content, action),
      confidence: template.confidence,
      priority: template.priority
    };
  }

  private async getContextualSuggestions(action: Action): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Add suggestions based on action properties
    if (action.breaking) {
      suggestions.push({
        id: `ctx-${Date.now()}-breaking`,
        type: 'implementation_approach',
        content: 'This is a breaking change - consider version bump',
        confidence: 0.95,
        priority: 'high'
      });
    }

    // Add general suggestions
    suggestions.push({
      id: `ctx-${Date.now()}-general`,
      type: 'implementation_approach',
      content: 'Ensure proper error handling',
      confidence: 0.8,
      priority: 'medium'
    });

    return suggestions;
  }

  private formatAsList(suggestions: Suggestion[]): SelectedSuggestions {
    return {
      selected: suggestions.map(s => s.id),
      rejected: [],
      modified: new Map()
    };
  }

  private formatAsInteractive(suggestions: Suggestion[]): SelectedSuggestions {
    // In interactive mode, user would select which suggestions to accept
    // For now, return all as selected
    return this.formatAsList(suggestions);
  }

  private interpolate(content: string, action: Action): string {
    return content
      .replace('${action.type}', action.type)
      .replace('${action.description}', action.description)
      .replace('${action.resource}', action.resource);
  }
}
