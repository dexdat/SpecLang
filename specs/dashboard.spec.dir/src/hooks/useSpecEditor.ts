// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-spec-editing

/**

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

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
  kind: 'entity' | 'operation' | 'code' | 'query' | 'prose';
  attributes: Record<string, string>;
}

export interface UseSpecEditorOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  onToast?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export interface UseSpecEditorReturn {
  // State
  currentSpec: Spec | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  previewContent: string;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // Actions
  createNewSpec: () => Promise<void>;
  editSpec: (specId: string) => Promise<void>;
  addBlock: () => Promise<void>;
  autocompleteRef: (partial: string) => Promise<string[]>;
  validateRef: (ref: string) => Promise<boolean>;
  saveSpec: () => Promise<void>;
  updateContent: (content: string) => void;
  closeSpec: () => void;
  
  // Editor integration
  setEditorRef: (editor: { insertText: (text: string) => void } | null) => void;
  insertAtCursor: (text: string) => void;
}

// Mock MCP client - would be injected in real implementation
const mcpClient = {
  call: async (tool: string, params: Record<string, unknown>): Promise<unknown> => {
    console.log(`[MCP] Calling ${tool}:`, params);
    return { success: true };
  }
};

/**
function generateHeaderTemplate(data: NewSpecDialogData): string {
id: @speclang/${data.id}
version: 0.1.0
layer: ${data.layer}
tags: [${data.tags.join(', ')}]
short: Description of spec
---


## Overview

### @block:overview @kind:prose
Content here...
`;
}

/**

function generateBlockTemplate(data: AddBlockDialogData): string {
  const attrs = Object.entries(data.attributes)
    .map(([key, value]) => `    ${key}: "${value}"`)
    .join('\n');
  
  const attrSection = attrs ? `${attrs}\n` : '';
  
  return `### @block:${data.blockId} @kind:${data.kind}
${attrSection}\`\`\`speclang
\`\`\`
`;
}

/**

function validateContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = content.split('\n');
  
  // Check for valid header
    errors.push({
      line: 1,
      column: 1,
      severity: 'error'
    });
  }
  
  // Check for required fields in header
  const headerEndIndex = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (headerEndIndex > 0) {
    const header = lines.slice(0, headerEndIndex).join('\n');
    
    if (!header.includes('id:')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing required field: id',
        severity: 'error'
      });
    }
    
    if (!header.includes('version:')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Missing required field: version',
        severity: 'warning'
      });
    }
  }
  
  // Check for @block: references
  const blockRegex = /@block:(\S+)/g;
  let match;
  
  lines.forEach((line, lineIndex) => {
    // Check for orphan @ref: references
    const refRegex = /@ref:(\S+)/g;
    while ((match = refRegex.exec(line)) !== null) {
      const ref = match[1];
      
      // Basic validation - refs should have proper format
      if (!ref.includes('/') && !ref.startsWith('@')) {
        errors.push({
          line: lineIndex + 1,
          column: match.index + 1,
          message: `Invalid reference format: ${ref}`,
          severity: 'warning'
        });
      }
    }
  });
  
  return errors;
}

/**

async function showNewSpecDialog(): Promise<NewSpecDialogData> {
  // In real implementation, this would open a modal dialog
  return {
    id: 'new-spec',
    layer: 5,
    tags: ['speclang']
  };
}

/**
# speclang-header lines:5
# id: @specs/dashboard
# version: 1.0.0
# layer: 5

async function showAddBlockDialog(): Promise<AddBlockDialogData> {
  // In real implementation, this would open a modal dialog
  return {
    blockId: 'new-block',
    kind: 'operation',
    attributes: {}
  };
}

/**
 * useSpecEditor React hook
 */
export function useSpecEditor(options: UseSpecEditorOptions = {}): UseSpecEditorReturn {
  const {
    autoSave = false,
    autoSaveDelay = 2000,
    onToast
  } = options;

  const [currentSpec, setCurrentSpec] = useState<Spec | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const editorRef = useRef<{ insertText: (text: string) => void } | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed preview content
  const previewContent = useMemo(() => {
    if (!currentSpec) return '';
    // In real implementation, would parse and render spec
    return currentSpec.content;
  }, [currentSpec]);

  // Toast notification
  const toast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (onToast) {
      onToast(message, type);
    } else {
      console.log(`[Toast] ${type}: ${message}`);
    }
  }, [onToast]);

  // Validate content
  const runValidation = useCallback((content: string): ValidationError[] => {
    const errors = validateContent(content);
    setValidationErrors(errors);
    return errors;
  }, []);

  // Set editor reference
  const setEditorRef = useCallback((editor: { insertText: (text: string) => void } | null) => {
    editorRef.current = editor;
  }, []);

  // Insert text at cursor
  const insertAtCursor = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  }, []);

  // Create new spec
  const createNewSpec = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await showNewSpecDialog();
      const template = generateHeaderTemplate(data);
      
      setCurrentSpec({ id: data.id, content: template });
      setIsDirty(true);
      runValidation(template);
      
      toast('New spec created', 'success');
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to create spec: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast, runValidation]);

  // Edit existing spec
  const editSpec = useCallback(async (specId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await mcpClient.call('speclang_get_spec', { id: specId }) as string;
      
      setCurrentSpec({ id: specId, content });
      setIsDirty(false);
      runValidation(content);
      
      toast('Spec loaded', 'success');
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to load spec: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast, runValidation]);

  // Add block
  const addBlock = useCallback(async () => {
    if (!currentSpec) {
      toast('No spec open', 'error');
      return;
    }
    
    try {
      const data = await showAddBlockDialog();
      const template = generateBlockTemplate(data);
      
      // Insert at cursor
      insertAtCursor(template);
      
      // Update content
      const newContent = currentSpec.content + '\n' + template;
      setCurrentSpec({ ...currentSpec, content: newContent });
      setIsDirty(true);
      runValidation(newContent);
      
      toast('Block added', 'success');
    } catch (err) {
      const error = err as Error;
      toast(`Failed to add block: ${error.message}`, 'error');
    }
  }, [currentSpec, insertAtCursor, toast, runValidation]);

  // Autocomplete references
  const autocompleteRef = useCallback(async (partial: string): Promise<string[]> => {
    try {
      const results = await mcpClient.call('speclang_search', { query: partial }) as Array<{ id: string }>;
      return results.map(r => r.id);
    } catch (err) {
      console.error('Autocomplete failed:', err);
      return [];
    }
  }, []);

  // Validate reference
  const validateRef = useCallback(async (ref: string): Promise<boolean> => {
    try {
      const exists = await mcpClient.call('speclang_ref_exists', { ref }) as boolean;
      return exists;
    } catch (err) {
      console.error('Ref validation failed:', err);
      return false;
    }
  }, []);

  // Update content
  const updateContent = useCallback((content: string) => {
    if (!currentSpec) return;
    
    setCurrentSpec({ ...currentSpec, content });
    setIsDirty(true);
    runValidation(content);
  }, [currentSpec, runValidation]);

  // Save spec
  const saveSpec = useCallback(async () => {
    if (!currentSpec) {
      toast('No spec to save', 'error');
      return;
    }
    
    // Check for errors
    if (validationErrors.some(e => e.severity === 'error')) {
      toast('Cannot save: validation errors must be fixed first', 'error');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await mcpClient.call('speclang_save_spec', {
        id: currentSpec.id,
        content: currentSpec.content
      });
      
      setIsDirty(false);
      toast('Spec saved', 'success');
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast(`Failed to save: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [currentSpec, validationErrors, toast]);

  // Close spec
  const closeSpec = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?');
      if (!confirmed) return;
    }
    
    setCurrentSpec(null);
    setIsDirty(false);
    setValidationErrors([]);
    setError(null);
  }, [isDirty]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && isDirty && currentSpec) {
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
  }, [autoSave, isDirty, currentSpec, autoSaveDelay, saveSpec]);

  return {
    // State
    currentSpec,
    isDirty,
    validationErrors,
    previewContent,
    isLoading,
    isSaving,
    error,
    
    // Actions
    createNewSpec,
    editSpec,
    addBlock,
    autocompleteRef,
    validateRef,
    saveSpec,
    updateContent,
    closeSpec,
    
    // Editor integration
    setEditorRef,
    insertAtCursor
  };
}

export default useSpecEditor;
