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
    currentSpec: Spec | null;
    isDirty: boolean;
    validationErrors: ValidationError[];
    previewContent: string;
    isLoading: boolean;
    isSaving: boolean;
    error: Error | null;
    createNewSpec: () => Promise<void>;
    editSpec: (specId: string) => Promise<void>;
    addBlock: () => Promise<void>;
    autocompleteRef: (partial: string) => Promise<string[]>;
    validateRef: (ref: string) => Promise<boolean>;
    saveSpec: () => Promise<void>;
    updateContent: (content: string) => void;
    closeSpec: () => void;
    setEditorRef: (editor: {
        insertText: (text: string) => void;
    } | null) => void;
    insertAtCursor: (text: string) => void;
}
/**
 * useSpecEditor React hook
 */
export declare function useSpecEditor(options?: UseSpecEditorOptions): UseSpecEditorReturn;
export default useSpecEditor;
//# sourceMappingURL=useSpecEditor.d.ts.map