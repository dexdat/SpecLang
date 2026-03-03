"use strict";
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEventHandlers = useEventHandlers;
exports.debounce = debounce;
exports.throttle = throttle;
exports.useClickOutside = useClickOutside;
exports.useLongPress = useLongPress;
/**
 * Event Handlers
 *
 * Centralized event handling for UI components.
 */
const react_1 = require("react");
/**
 * useEventHandlers hook
 *
 * Provides centralized event handling for the UI.
 */
function useEventHandlers() {
    const handlersRef = (0, react_1.useRef)({});
    /**
     * Register an event handler
     */
    const registerHandler = (0, react_1.useCallback)((event, handler) => {
        if (!handlersRef.current[event]) {
            handlersRef.current[event] = [];
        }
        handlersRef.current[event].push(handler);
        // Return cleanup function
        return () => {
            const handlers = handlersRef.current[event];
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }, []);
    /**
     * Emit an event to all registered handlers
     */
    const emit = (0, react_1.useCallback)((event, data) => {
        const handlers = handlersRef.current[event] || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }, []);
    /**
     * Clear all handlers for an event
     */
    const clearHandlers = (0, react_1.useCallback)((event) => {
        if (event) {
            handlersRef.current[event] = [];
        }
        else {
            handlersRef.current = {};
        }
    }, []);
    return {
        registerHandler,
        emit,
        clearHandlers
    };
}
/**
 * Create a debounced handler
 */
function debounce(fn, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
/**
 * Create a throttled handler
 */
function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
/**
 * useClickOutside hook
 *
 * Detects clicks outside of a specified element.
 */
function useClickOutside(ref, handler) {
    (0, react_1.useEffect)(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}
/**
 * useLongPress hook
 *
 * Detects long press gestures.
 */
function useLongPress(ref, onLongPress, onClick, duration = 500) {
    const timeoutRef = (0, react_1.useRef)(null);
    const isLongPressRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        const element = ref.current;
        if (!element)
            return;
        const handleMouseDown = () => {
            isLongPressRef.current = false;
            timeoutRef.current = setTimeout(() => {
                isLongPressRef.current = true;
                onLongPress();
            }, duration);
        };
        const handleMouseUp = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (!isLongPressRef.current && onClick) {
                onClick();
            }
        };
        const handleMouseLeave = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mouseup', handleMouseUp);
        element.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mouseup', handleMouseUp);
            element.removeEventListener('mouseleave', handleMouseLeave);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [ref, onLongPress, onClick, duration]);
}
exports.default = useEventHandlers;
//# sourceMappingURL=event-handlers.js.map