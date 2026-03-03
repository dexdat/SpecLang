/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
export type ShortcutAction = 'save' | 'saveAll' | 'newSpec' | 'openSpec' | 'toggleComment' | 'autocomplete' | 'triggerCascade' | 'pauseCascade' | 'finalizeCascade' | 'abortCascade' | 'refreshDashboard' | 'gitCommit' | 'gitHistory' | 'togglePreview' | 'closeEditor' | 'find' | 'replace';
export interface ShortcutDefinition {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}
export interface ShortcutHandlers {
    save?: () => void;
    saveAll?: () => void;
    newSpec?: () => void;
    openSpec?: () => void;
    toggleComment?: () => void;
    autocomplete?: () => void;
    triggerCascade?: () => void;
    pauseCascade?: () => void;
    finalizeCascade?: () => void;
    abortCascade?: () => void;
    refreshDashboard?: () => void;
    gitCommit?: () => void;
    gitHistory?: () => void;
    togglePreview?: () => void;
    closeEditor?: () => void;
    find?: () => void;
    replace?: () => void;
}
/**
 * Default keyboard shortcuts
 */
export declare const SHORTCUTS: Record<string, ShortcutAction>;
/**
 * Build keyboard combo string from event
 */
export declare function buildCombo(e: KeyboardEvent): string;
/**
 * Parse keyboard combo string to definition
 */
export declare function parseCombo(combo: string): ShortcutDefinition;
/**
 * Check if event matches a shortcut definition
 */
export declare function matchesShortcut(e: KeyboardEvent, definition: ShortcutDefinition): boolean;
/**
 * Get action for keyboard event
 */
export declare function getAction(e: KeyboardEvent): ShortcutAction | null;
/**
 * useKeyboardShortcuts hook
 *
 * Provides keyboard shortcut handling.
 */
export declare function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled?: boolean): void;
/**
 * Get display string for shortcut
 */
export declare function getShortcutDisplay(action: ShortcutAction): string;
export default useKeyboardShortcuts;
//# sourceMappingURL=keyboard-shortcuts.d.ts.map