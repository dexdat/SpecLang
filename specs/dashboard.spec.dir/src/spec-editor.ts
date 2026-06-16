// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-spec-editing

/**
 * Spec Editor Interactions
 * 
 * Handles spec creation, editing, block management, and reference validation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Types
export interface Spec {
  id: string;
  content: string;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface NewSpecDialogData {
  id: string;
  layer: number;
  tags: string[];
}

export interface AddBlockDialogData {
  blockId: string;
  kind: 'entity' | 'operation' | 'code' | 'query';
  attributes: Record<string, string>;
}

export interface SpecEditorState {
  currentSpec: Spec | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  previewContent: string;
  isLoading: boolean;
}

export interface SpecEditorOptions {
  onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

// Mock MCP client - in real implementation would use actual MCP client
const mcpClient = {
  call: async (tool: string, params: Record<string, unknown>): Promise<unknown> => {
    console.log(`[MCP] Calling ${tool}:`, params);
    return { success: true };
  }
};

/**
 * Generate header template for new spec
 */
function generateHeaderTemplate(data: NewSpecDialogData): string {
  return `# speclang-header lines:14
id: @speclang/${data.id}
version: 0.1.0
layer: ${data.layer}
tags: [${data.tags.join(', ')}]
short: Description of spec
---

# ${data.id}

## Overview

### @block:overview @kind:prose
Content here...
`;
}

/**
 * Generate block template
 */
function generateBlockTemplate(data: AddBlockDialogData): string {
  const attrs = Object.entries(data.attributes)
    .map(([key, value]) => `    ${key}: "${value}"`)
    .join('\n');
  
  return `### @block:${data.blockId} @kind:${data.kind}
${attrs}
\`\`\`speclang
# ${data.blockId} implementation
\`\`\`
`;
}

/**
 * Show new spec dialog (mock - returns mock data)
 */
async function showNewSpecDialog(): Promise<NewSpecDialogData> {
  // In real implementation, this would open a modal dialog
  return {
    id: 'new-spec',
    layer: 5,
    tags: ['speclang']
  };
}

/**
 * Show add block dialog (mock - returns mock data)
 */
async function showAddBlockDialog(): Promise<AddBlockDialogData> {
  // In real implementation, this would open a modal dialog
  return {
    blockId: 'new-block',
    kind: 'operation',
    attributes: {}
  };
}

/**
 * useSpecEditor hook
 * 
 * Provides spec editing functionality including:
 * - createNewSpec: Create a new spec with header template
 * - editSpec: Load and edit existing spec
 * - addBlock: Insert new block at cursor
 * - autocompleteRef: Get reference suggestions
 * - validateRef: Check if reference exists
 * - saveSpec: Save spec with validation
 */
export function useSpecEditor(options: SpecEditorOptions = {}) {
  const { onToast, autoSave = false, autoSaveDelay = 2000 } = options;
  
  const [state, setState] = useState<SpecEditorState>({
    currentSpec: null,
    isDirty: false,
    validationErrors: [],
    previewContent: '',
    isLoading: false
  });

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<{ insertText: (text: string) => void } | null>(null);

  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }, [onToast]);

  /**
   * Set editor reference for cursor operations
   */
  const setEditorRef = useCallback((editor: { insertText: (text: string) => void } | null) => {
    editorRef.current = editor;
  }, []);

  /**
   * Insert text at cursor position
   */
  const insertAtCursor = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  }, []);

  /**
   * Validate spec content
   */
  const validateContent = useCallback((content: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check for valid header
    if (!content.includes('# speclang-header')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing speclang-header',
        severity: 'error'
      });
    }
    
    // Check for @block: references
    const blockRegex = /@block:(\S+)/g;
    let match;
    const blocks = new Set<string>();
    
    while ((match = blockRegex.exec(content)) !== null) {
      blocks.add(match[1]);
    }
    
    // Check for @ref: references that need validation
    const refRegex = /@ref:(\S+)/g;
    const lines = content.split('\n');
    
    while ((match = refRegex.exec(content)) !== null) {
      const ref = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;
      
      // Mock validation - in real implementation would call MCP
      if (ref.includes('undefined')) {
        errors.push({
          line: lineNum,
          column: match.index,
          message: `Reference "${ref}" not found`,
          severity: 'error'
        });
      }
    }
    
    return errors;
  }, []);

  /**
   * Create a new spec
   */
  const createNewSpec = useCallback(async () => {
    try {
      const data = await showNewSpecDialog();
      const template = generateHeaderTemplate(data);
      
      setState(prev => ({
        ...prev,
        currentSpec: { id: data.id, content: template },
        isDirty: true,
        validationErrors: validateContent(template)
      }));
      
      toast('New spec created', 'success');
    } catch (error) {
      toast(`Failed to create spec: ${error}`, 'error');
    }
  }, [toast, validateContent]);

  /**
   * Edit an existing spec
   */
  const editSpec = useCallback(async (specId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const content = await mcpClient.call('speclang_get_spec', { id: specId }) as string;
      
      setState(prev => ({
        ...prev,
        currentSpec: { id: specId, content },
        isDirty: false,
        validationErrors: validateContent(content),
        isLoading: false
      }));
      
      toast('Spec loaded', 'success');
    } catch (error) {
      toast(`Failed to load spec: ${error}`, 'error');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast, validateContent]);

  /**
   * Add a new block at cursor
   */
  const addBlock = useCallback(async () => {
    if (!state.currentSpec) {
      toast('No spec open', 'error');
      return;
    }
    
    try {
      const data = await showAddBlockDialog();
      const template = generateBlockTemplate(data);
      insertAtCursor(template);
      
      const newContent = state.currentSpec.content + '\n' + template;
      
      setState(prev => ({
        ...prev,
        currentSpec: { ...prev.currentSpec!, content: newContent },
        isDirty: true,
        validationErrors: validateContent(newContent)
      }));
      
      toast('Block added', 'success');
    } catch (error) {
      toast(`Failed to add block: ${error}`, 'error');
    }
  }, [state.currentSpec, insertAtCursor, validateContent, toast]);

  /**
   * Autocomplete @ref: references
   */
  const autocompleteRef = useCallback(async (partial: string): Promise<string[]> => {
    try {
      const results = await mcpClient.call('speclang_search', { query: partial }) as Array<{ id: string }>;
      return results.map(r => r.id);
    } catch (error) {
      console.error('Autocomplete failed:', error);
      return [];
    }
  }, []);

  /**
   * Validate a reference exists
   */
  const validateRef = useCallback(async (ref: string): Promise<boolean> => {
    try {
      const exists = await mcpClient.call('speclang_ref_exists', { ref }) as boolean;
      return exists;
    } catch (error) {
      console.error('Ref validation failed:', error);
      return false;
    }
  }, []);

  /**
   * Update content and trigger validation
   */
  const updateContent = useCallback((content: string) => {
    if (!state.currentSpec) return;
    
    setState(prev => ({
      ...prev,
      currentSpec: { ...prev.currentSpec!, content },
      isDirty: true,
      validationErrors: validateContent(content)
    }));
  }, [state.currentSpec, validateContent]);

  /**
   * Save spec
   */
  const saveSpec = useCallback(async () => {
    if (!state.currentSpec) {
      toast('No spec to save', 'error');
      return;
    }
    
    if (state.validationErrors.some(e => e.severity === 'error')) {
      toast('Cannot save: validation errors', 'error');
      return;
    }
    
    try {
      await mcpClient.call('speclang_save_spec', {
        id: state.currentSpec.id,
        content: state.currentSpec.content
      });
      
      setState(prev => ({
        ...prev,
        isDirty: false
      }));
      
      toast('Spec saved', 'success');
    } catch (error) {
      toast(`Failed to save: ${error}`, 'error');
    }
  }, [state.currentSpec, state.validationErrors, toast]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && state.isDirty && state.currentSpec) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        saveSpec();
      }, autoSaveDelay);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, state.isDirty, state.currentSpec, autoSaveDelay, saveSpec]);

  return {
    state,
    createNewSpec,
    editSpec,
    addBlock,
    autocompleteRef,
    validateRef,
    saveSpec,
    updateContent,
    setEditorRef,
    insertAtCursor
  };
}

export default useSpecEditor;
