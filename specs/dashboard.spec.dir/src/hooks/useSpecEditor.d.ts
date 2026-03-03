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
export declare function useSpecEditor(options?: UseSpecEditorOptions): UseSpecEditorReturn;
export default useSpecEditor;
//# sourceMappingURL=useSpecEditor.d.ts.map