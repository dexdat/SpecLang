"use strict";
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-spec-editing
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSpecEditor = useSpecEditor;
/**
 * useSpecEditor Hook
 *
 * React hook for spec editing functionality.
 */
const react_1 = require("react");
// Mock MCP client - would be injected in real implementation
const mcpClient = {
    call: async (tool, params) => {
        console.log(`[MCP] Calling ${tool}:`, params);
        return { success: true };
    }
};
/**
 * Generate header template for new spec
 */
function generateHeaderTemplate(data) {
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
function generateBlockTemplate(data) {
    const attrs = Object.entries(data.attributes)
        .map(([key, value]) => `    ${key}: "${value}"`)
        .join('\n');
    const attrSection = attrs ? `${attrs}\n` : '';
    return `### @block:${data.blockId} @kind:${data.kind}
${attrSection}\`\`\`speclang
# ${data.blockId} implementation
\`\`\`
`;
}
/**
 * Validate spec content
 */
function validateContent(content) {
    const errors = [];
    const lines = content.split('\n');
    // Check for valid header
    if (!lines[0]?.includes('speclang-header')) {
        errors.push({
            line: 1,
            column: 1,
            message: 'Missing speclang-header in first line',
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
 * Show new spec dialog (mock)
 */
async function showNewSpecDialog() {
    // In real implementation, this would open a modal dialog
    return {
        id: 'new-spec',
        layer: 5,
        tags: ['speclang']
    };
}
/**
 * Show add block dialog (mock)
 */
async function showAddBlockDialog() {
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
function useSpecEditor(options = {}) {
    const { autoSave = false, autoSaveDelay = 2000, onToast } = options;
    const [currentSpec, setCurrentSpec] = (0, react_1.useState)(null);
    const [isDirty, setIsDirty] = (0, react_1.useState)(false);
    const [validationErrors, setValidationErrors] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const editorRef = (0, react_1.useRef)(null);
    const autoSaveTimerRef = (0, react_1.useRef)(null);
    // Computed preview content
    const previewContent = (0, react_1.useMemo)(() => {
        if (!currentSpec)
            return '';
        // In real implementation, would parse and render spec
        return currentSpec.content;
    }, [currentSpec]);
    // Toast notification
    const toast = (0, react_1.useCallback)((message, type = 'info') => {
        if (onToast) {
            onToast(message, type);
        }
        else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    }, [onToast]);
    // Validate content
    const runValidation = (0, react_1.useCallback)((content) => {
        const errors = validateContent(content);
        setValidationErrors(errors);
        return errors;
    }, []);
    // Set editor reference
    const setEditorRef = (0, react_1.useCallback)((editor) => {
        editorRef.current = editor;
    }, []);
    // Insert text at cursor
    const insertAtCursor = (0, react_1.useCallback)((text) => {
        if (editorRef.current) {
            editorRef.current.insertText(text);
        }
    }, []);
    // Create new spec
    const createNewSpec = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await showNewSpecDialog();
            const template = generateHeaderTemplate(data);
            setCurrentSpec({ id: data.id, content: template });
            setIsDirty(true);
            runValidation(template);
            toast('New spec created', 'success');
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to create spec: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [toast, runValidation]);
    // Edit existing spec
    const editSpec = (0, react_1.useCallback)(async (specId) => {
        setIsLoading(true);
        setError(null);
        try {
            const content = await mcpClient.call('speclang_get_spec', { id: specId });
            setCurrentSpec({ id: specId, content });
            setIsDirty(false);
            runValidation(content);
            toast('Spec loaded', 'success');
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to load spec: ${error.message}`, 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [toast, runValidation]);
    // Add block
    const addBlock = (0, react_1.useCallback)(async () => {
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
        }
        catch (err) {
            const error = err;
            toast(`Failed to add block: ${error.message}`, 'error');
        }
    }, [currentSpec, insertAtCursor, toast, runValidation]);
    // Autocomplete references
    const autocompleteRef = (0, react_1.useCallback)(async (partial) => {
        try {
            const results = await mcpClient.call('speclang_search', { query: partial });
            return results.map(r => r.id);
        }
        catch (err) {
            console.error('Autocomplete failed:', err);
            return [];
        }
    }, []);
    // Validate reference
    const validateRef = (0, react_1.useCallback)(async (ref) => {
        try {
            const exists = await mcpClient.call('speclang_ref_exists', { ref });
            return exists;
        }
        catch (err) {
            console.error('Ref validation failed:', err);
            return false;
        }
    }, []);
    // Update content
    const updateContent = (0, react_1.useCallback)((content) => {
        if (!currentSpec)
            return;
        setCurrentSpec({ ...currentSpec, content });
        setIsDirty(true);
        runValidation(content);
    }, [currentSpec, runValidation]);
    // Save spec
    const saveSpec = (0, react_1.useCallback)(async () => {
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
        }
        catch (err) {
            const error = err;
            setError(error);
            toast(`Failed to save: ${error.message}`, 'error');
        }
        finally {
            setIsSaving(false);
        }
    }, [currentSpec, validationErrors, toast]);
    // Close spec
    const closeSpec = (0, react_1.useCallback)(() => {
        if (isDirty) {
            const confirmed = window.confirm('You have unsaved changes. Discard them?');
            if (!confirmed)
                return;
        }
        setCurrentSpec(null);
        setIsDirty(false);
        setValidationErrors([]);
        setError(null);
    }, [isDirty]);
    // Auto-save effect
    (0, react_1.useEffect)(() => {
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
exports.default = useSpecEditor;
//# sourceMappingURL=useSpecEditor.js.map