/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*

/**
 * Keyboard Shortcuts
 * 
 * Provides keyboard shortcut handling for the dashboard.
 */

import { useEffect, useCallback, useRef } from 'react';

// Types
export type ShortcutAction =
  | 'save'
  | 'saveAll'
  | 'newSpec'
  | 'openSpec'
  | 'toggleComment'
  | 'autocomplete'
  | 'triggerCascade'
  | 'pauseCascade'
  | 'finalizeCascade'
  | 'abortCascade'
  | 'refreshDashboard'
  | 'gitCommit'
  | 'gitHistory'
  | 'togglePreview'
  | 'closeEditor'
  | 'find'
  | 'replace';

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
export const SHORTCUTS: Record<string, ShortcutAction> = {
  'ctrl+s': 'save',
  'ctrl+shift+s': 'saveAll',
  'ctrl+n': 'newSpec',
  'ctrl+o': 'openSpec',
  'ctrl+/': 'toggleComment',
  'ctrl+space': 'autocomplete',
  'ctrl+enter': 'triggerCascade',
  'ctrl+shift+p': 'pauseCascade',
  'ctrl+shift+f': 'finalizeCascade',
  'escape': 'abortCascade',
  'f5': 'refreshDashboard',
  'ctrl+g': 'gitCommit',
  'ctrl+shift+h': 'gitHistory',
  'ctrl+shift+v': 'togglePreview',
  'ctrl+w': 'closeEditor',
  'ctrl+f': 'find',
  'ctrl+h': 'replace'
};

/**
 * Build keyboard combo string from event
 */
export function buildCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  if (e.metaKey) parts.push('meta');
  
  // Normalize key
  let key = e.key.toLowerCase();
  
  // Handle special keys
  if (key === ' ') key = 'space';
  if (key === 'escape') key = 'escape';
  if (key === 'enter') key = 'enter';
  if (key === 'backspace') key = 'backspace';
  if (key === 'tab') key = 'tab';
  if (key === 'delete') key = 'delete';
  if (key === 'arrowup') key = 'arrowup';
  if (key === 'arrowdown') key = 'arrowdown';
  if (key === 'arrowleft') key = 'arrowleft';
  if (key === 'arrowright') key = 'arrowright';
  
  parts.push(key);
  
  return parts.join('+');
}

/**
 * Parse keyboard combo string to definition
 */
export function parseCombo(combo: string): ShortcutDefinition {
  const parts = combo.toLowerCase().split('+');
  const definition: ShortcutDefinition = {
    key: parts[parts.length - 1],
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta')
  };
  
  return definition;
}

/**
 * Check if event matches a shortcut definition
 */
export function matchesShortcut(e: KeyboardEvent, definition: ShortcutDefinition): boolean {
  const combo = buildCombo(e);
  const expected = buildComboFromDefinition(definition);
  
  return combo === expected;
}

/**
 * Build combo string from definition
 */
function buildComboFromDefinition(def: ShortcutDefinition): string {
  const parts: string[] = [];
  
  if (def.ctrl) parts.push('ctrl');
  if (def.shift) parts.push('shift');
  if (def.alt) parts.push('alt');
  if (def.meta) parts.push('meta');
  
  parts.push(def.key);
  
  return parts.join('+');
}

/**
 * Get action for keyboard event
 */
export function getAction(e: KeyboardEvent): ShortcutAction | null {
  const combo = buildCombo(e);
  return SHORTCUTS[combo] || null;
}

/**
 * useKeyboardShortcuts hook
 * 
 * Provides keyboard shortcut handling.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't handle shortcuts when typing in input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow some shortcuts even in inputs
      const allowedInInput = ['escape', 'ctrl+f', 'ctrl+h'];
      const combo = buildCombo(e);
      
      if (!allowedInInput.includes(combo)) {
        return;
      }
    }

    const action = getAction(e);
    
    if (action && handlersRef.current[action]) {
      e.preventDefault();
      handlersRef.current[action]!();
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Get display string for shortcut
 */
export function getShortcutDisplay(action: ShortcutAction): string {
  const entries = Object.entries(SHORTCUTS);
  const entry = entries.find(([, a]) => a === action);
  
  if (!entry) return '';
  
  const combo = entry[0];
  return combo
    .replace('ctrl', '⌘')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('+', ' ')
    .toUpperCase();
}

export default useKeyboardShortcuts;
