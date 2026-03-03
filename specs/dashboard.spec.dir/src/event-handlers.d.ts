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
export declare function useEventHandlers(): {
    registerHandler: any;
    emit: any;
    clearHandlers: any;
};
/**
 * Create a debounced handler
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Create a throttled handler
 */
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * useClickOutside hook
 *
 * Detects clicks outside of a specified element.
 */
export declare function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void): void;
/**
 * useLongPress hook
 *
 * Detects long press gestures.
 */
export declare function useLongPress(ref: React.RefObject<HTMLElement>, onLongPress: () => void, onClick?: () => void, duration?: number): void;
export default useEventHandlers;
//# sourceMappingURL=event-handlers.d.ts.map