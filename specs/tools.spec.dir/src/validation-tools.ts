/**
speclang-header lines:5
id: @specs/tools
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Validation Tools
 * Source: @speclang/tools
 * 
 * Validation helpers for specs
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  Tool,
  ToolContext,
  ToolResult,
  ValidateHeaderInput,
  ValidateHeaderOutput,
  ValidateRefsInput,
  ValidateRefsOutput,
} from './types.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract @ref references from content
 */
function extractRefs(content: string): string[] {
  const refRegex = /@ref:([^\s\n]+)/g;
  const refs: string[] = [];
  let match;

  while ((match = refRegex.exec(content)) !== null) {
    refs.push(match[1]);
  }

  return refs;
}

/**
 * Check if a reference exists
 */
async function checkRefExists(
  ref: string,
  basePath: string = 'specs'
): Promise<boolean> {
  let filePath = ref.replace('@ref:', '');

  // Remove block reference
  const blockIndex = filePath.indexOf('#');
  if (blockIndex > 0) {
    filePath = filePath.substring(0, blockIndex);
  }

  // If no extension, add .spec.md
  if (!path.extname(filePath)) {
    filePath = path.join(filePath, 'index.spec.md');
  }

  // Try different extensions
  const candidates = [
    path.join(basePath, `${filePath}.spec.md`),
    path.join(basePath, `${filePath}.md`),
    path.join(basePath, filePath),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// VALIDATION TOOLS
// ============================================================================

/**
 * Validate header tool - validate spec header
 */
export const validateHeaderTool: Tool<ValidateHeaderInput, ValidateHeaderOutput> = {
  name: 'speclang_validate_header',
  description: 'Validate a spec header',
  category: 'validation',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      header: { type: 'object', description: 'Header object to validate' },
    },
    required: ['header'],
  },
  handler: async (
    input: ValidateHeaderInput,
    context: ToolContext
  ): Promise<ToolResult<ValidateHeaderOutput>> => {
    const { header } = input;

    console.log(`[ValidationTools] Validating header`);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!header.id) {
      errors.push('Missing required field: id');
    }

    if (!header.version) {
      errors.push('Missing required field: version');
    }

    if (header.layer === undefined || header.layer === null) {
      errors.push('Missing required field: layer');
    }

    // Validate id format
    if (header.id && !header.id.startsWith('@')) {
      errors.push('id must start with @');
    }

    // Validate version format
    if (header.version) {
      const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
      if (!versionRegex.test(header.version)) {
        warnings.push('version should follow semver format (e.g., 1.0.0)');
      }
    }

    // Validate layer range
    if (header.layer !== undefined) {
      if (typeof header.layer !== 'number' || header.layer < 0 || header.layer > 10) {
        errors.push('layer must be a number between 0 and 10');
      }
    }

    // Validate tags format
    if (header.tags && !Array.isArray(header.tags)) {
      errors.push('tags must be an array');
    }

    // Validate project_level if present
    const validProjectLevels = [
      'POC',
      'MVP',
      'Alpha',
      'Beta',
      'Production',
      'Startup',
      'SMB',
      'MSB',
      'Enterprise',
    ];

    if (header.project_level && !validProjectLevels.includes(header.project_level)) {
      warnings.push(`project_level should be one of: ${validProjectLevels.join(', ')}`);
    }

    // Validate agent_support if present
    const validAgentSupport = ['agent_autonomous', 'agent_assisted', 'human_only'];

    if (header.agent_support && !validAgentSupport.includes(header.agent_support)) {
      warnings.push(`agent_support should be one of: ${validAgentSupport.join(', ')}`);
    }

    return {
      success: errors.length === 0,
      data: { errors, warnings },
    };
  },
};

/**
 * Validate refs tool - check all refs in a spec exist
 */
export const validateRefsTool: Tool<ValidateRefsInput, ValidateRefsOutput> = {
  name: 'speclang_validate_refs',
  description: 'Check all refs in a spec exist',
  category: 'validation',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to spec file' },
    },
    required: ['path'],
  },
  handler: async (
    input: ValidateRefsInput,
    context: ToolContext
  ): Promise<ToolResult<ValidateRefsOutput>> => {
    const { path: filePath } = input;

    console.log(`[ValidationTools] Validating refs: ${filePath}`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const refs = extractRefs(content);
      const brokenRefs: string[] = [];

      // Check each ref
      for (const ref of refs) {
        let exists = false;

        // Try to resolve via index
        if (context.index?.specs) {
          const refId = ref.replace('@ref:', '').split('#')[0];
          exists = !!context.index.specs[refId];
        }

        // Try to resolve via file system
        if (!exists) {
          exists = await checkRefExists(ref);
        }

        // Try to resolve via database
        if (!exists && context.db) {
          const refId = ref.replace('@ref:', '').split('#')[0];
          const row = context.db.getDatabase().prepare(
            'SELECT id FROM specs WHERE id = ?'
          ).get(refId);
          exists = !!row;
        }

        if (!exists) {
          brokenRefs.push(ref);
        }
      }

      return {
        success: brokenRefs.length === 0,
        data: { broken_refs: brokenRefs },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Validate spec tool - full spec validation
 */
export const validateSpecTool: Tool<{ path: string }, { valid: boolean; errors: string[]; warnings: string[] }> = {
  name: 'speclang_validate_spec',
  description: 'Validate entire spec file',
  category: 'validation',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to spec file' },
    },
    required: ['path'],
  },
  handler: async (
    input: { path: string },
    context: ToolContext
  ): Promise<ToolResult<{ valid: boolean; errors: string[]; warnings: string[] }>> => {
    const { path: filePath } = input;

    console.log(`[ValidationTools] Validating spec: ${filePath}`);

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file exists
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        errors.push('File does not exist');
        return { success: false, data: { valid: false, errors, warnings } };
      }

      // Read file
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check header
      let headerStart = -1;
      let headerEnd = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          if (headerStart === -1) {
            headerStart = i;
          } else {
            headerEnd = i;
            break;
          }
        }
      }

      if (headerStart === -1 || headerEnd === -1) {
        errors.push('Missing header section (---)');
      } else {
        // Parse header
        const headerLines = lines.slice(headerStart + 1, headerEnd);
        const header: Record<string, any> = {};

        for (const line of headerLines) {
          const trimmed = line.trim();
          const colonIndex = trimmed.indexOf(':');
          if (colonIndex > 0) {
            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();
            if (value.startsWith('[') && value.endsWith(']')) {
              value = value.slice(1, -1);
              header[key] = value.split(',').map((s) => s.trim());
            } else {
              header[key] = value;
            }
          }
        }

        // Validate header
        if (!header.id) errors.push('Missing required field: id');
        if (!header.version) errors.push('Missing required field: version');
        if (header.layer === undefined) errors.push('Missing required field: layer');
        if (header.id && !header.id.startsWith('@')) {
          errors.push('id must start with @');
        }
      }

      // Check for empty content
      const bodyStart = headerEnd + 1;
      const body = lines.slice(bodyStart).join('\n').trim();
      if (body.length === 0) {
        warnings.push('Spec has no content');
      }

      // Check refs
      const refs = extractRefs(content);
      for (const ref of refs) {
        let exists = false;

        if (context.index?.specs) {
          const refId = ref.replace('@ref:', '').split('#')[0];
          exists = !!context.index.specs[refId];
        }

        if (!exists && context.db) {
          const refId = ref.replace('@ref:', '').split('#')[0];
          const row = context.db.getDatabase().prepare(
            'SELECT id FROM specs WHERE id = ?'
          ).get(refId);
          exists = !!row;
        }

        if (!exists) {
          warnings.push(`Reference not found: ${ref}`);
        }
      }

      return {
        success: errors.length === 0,
        data: { valid: errors.length === 0, errors, warnings },
      };
    } catch (error: any) {
      errors.push(error.message);
      return { success: false, data: { valid: false, errors, warnings } };
    }
  },
};
