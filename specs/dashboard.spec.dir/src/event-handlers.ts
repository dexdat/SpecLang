// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*

/**
 * Event Handlers
 * 
 * Centralized event handling for UI components.
 */

import { useCallback, useRef, useEffect } from 'react';

// Types
export interface EventHandlerMap {
  [event: string]: Array<(data?: unknown) => void>;
}

export interface DragEvent {
  type: 'dragstart' | 'dragover' | 'drop' | 'dragend';
  sourceId: string;
  targetId?: string;
  data?: unknown;
}

export interface ClickEvent {
  type: 'click' | 'dblclick' | 'contextmenu';
  targetId: string;
  data?: unknown;
}

/**
 * useEventHandlers hook
 * 
 * Provides centralized event handling for the UI.
 */
export function useEventHandlers() {
  const handlersRef = useRef<EventHandlerMap>({});

  /**
   * Register an event handler
   */
  const registerHandler = useCallback((event: string, handler: (data?: unknown) => void) => {
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
  const emit = useCallback((event: string, data?: unknown) => {
    const handlers = handlersRef.current[event] || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }, []);

  /**
   * Clear all handlers for an event
   */
  const clearHandlers = useCallback((event?: string) => {
    if (event) {
      handlersRef.current[event] = [];
    } else {
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
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
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
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
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
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
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
export function useLongPress(
  ref: React.RefObject<HTMLElement>,
  onLongPress: () => void,
  onClick?: () => void,
  duration: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

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

export default useEventHandlers;
