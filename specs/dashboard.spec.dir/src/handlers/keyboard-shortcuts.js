"use strict";
/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHORTCUTS = void 0;
exports.buildCombo = buildCombo;
exports.parseCombo = parseCombo;
exports.matchesShortcut = matchesShortcut;
exports.getAction = getAction;
exports.useKeyboardShortcuts = useKeyboardShortcuts;
exports.getShortcutDisplay = getShortcutDisplay;
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*
/**
 * Keyboard Shortcuts
 *
 * Provides keyboard shortcut handling for the dashboard.
 */
const react_1 = require("react");
/**
 * Default keyboard shortcuts
 */
exports.SHORTCUTS = {
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
function buildCombo(e) {
    const parts = [];
    if (e.ctrlKey)
        parts.push('ctrl');
    if (e.shiftKey)
        parts.push('shift');
    if (e.altKey)
        parts.push('alt');
    if (e.metaKey)
        parts.push('meta');
    // Normalize key
    let key = e.key.toLowerCase();
    // Handle special keys
    if (key === ' ')
        key = 'space';
    if (key === 'escape')
        key = 'escape';
    if (key === 'enter')
        key = 'enter';
    if (key === 'backspace')
        key = 'backspace';
    if (key === 'tab')
        key = 'tab';
    if (key === 'delete')
        key = 'delete';
    if (key === 'arrowup')
        key = 'arrowup';
    if (key === 'arrowdown')
        key = 'arrowdown';
    if (key === 'arrowleft')
        key = 'arrowleft';
    if (key === 'arrowright')
        key = 'arrowright';
    parts.push(key);
    return parts.join('+');
}
/**
 * Parse keyboard combo string to definition
 */
function parseCombo(combo) {
    const parts = combo.toLowerCase().split('+');
    const definition = {
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
function matchesShortcut(e, definition) {
    const combo = buildCombo(e);
    const expected = buildComboFromDefinition(definition);
    return combo === expected;
}
/**
 * Build combo string from definition
 */
function buildComboFromDefinition(def) {
    const parts = [];
    if (def.ctrl)
        parts.push('ctrl');
    if (def.shift)
        parts.push('shift');
    if (def.alt)
        parts.push('alt');
    if (def.meta)
        parts.push('meta');
    parts.push(def.key);
    return parts.join('+');
}
/**
 * Get action for keyboard event
 */
function getAction(e) {
    const combo = buildCombo(e);
    return exports.SHORTCUTS[combo] || null;
}
/**
 * useKeyboardShortcuts hook
 *
 * Provides keyboard shortcut handling.
 */
function useKeyboardShortcuts(handlers, enabled = true) {
    const handlersRef = (0, react_1.useRef)(handlers);
    handlersRef.current = handlers;
    const handleKeyDown = (0, react_1.useCallback)((e) => {
        if (!enabled)
            return;
        // Don't handle shortcuts when typing in input/textarea
        const target = e.target;
        if (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable) {
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
            handlersRef.current[action]();
        }
    }, [enabled]);
    (0, react_1.useEffect)(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
/**
 * Get display string for shortcut
 */
function getShortcutDisplay(action) {
    const entries = Object.entries(exports.SHORTCUTS);
    const entry = entries.find(([, a]) => a === action);
    if (!entry)
        return '';
    const combo = entry[0];
    return combo
        .replace('ctrl', '⌘')
        .replace('shift', '⇧')
        .replace('alt', '⌥')
        .replace('+', ' ')
        .toUpperCase();
}
exports.default = useKeyboardShortcuts;
//# sourceMappingURL=keyboard-shortcuts.js.map