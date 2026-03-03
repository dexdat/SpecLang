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
export declare function useSpecEditor(options?: SpecEditorOptions): {
    state: any;
    createNewSpec: any;
    editSpec: any;
    addBlock: any;
    autocompleteRef: any;
    validateRef: any;
    saveSpec: any;
    updateContent: any;
    setEditorRef: any;
    insertAtCursor: any;
};
export default useSpecEditor;
//# sourceMappingURL=spec-editor.d.ts.map