/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
export interface DragItem {
    id: string;
    type: 'file' | 'folder' | 'block' | 'agent';
    data?: unknown;
}
export interface DropTarget {
    id: string;
    accepts: string[];
}
export interface DragState {
    isDragging: boolean;
    draggedItem: DragItem | null;
    dropTarget: DropTarget | null;
}
export interface DragDropOptions {
    onDragStart?: (item: DragItem) => void;
    onDragEnd?: (item: DragItem, success: boolean) => void;
    onDrop?: (item: DragItem, target: DropTarget) => void;
    onDragOver?: (item: DragItem, target: DropTarget) => void;
}
/**
 * useDragDrop hook
 *
 * Provides drag and drop functionality.
 */
export declare function useDragDrop(options?: DragDropOptions): {
    isDragging: boolean;
    draggedItem: DragItem;
    dropTarget: DropTarget;
    startDrag: (item: DragItem) => void;
    endDrag: (success?: boolean) => void;
    setDropTarget: (target: DropTarget | null) => void;
    canDrop: (target: DropTarget) => boolean;
    handleDrop: (target: DropTarget) => boolean;
    handleDragOver: (target: DropTarget) => boolean;
};
/**
 * useDraggable hook
 *
 * Makes an element draggable.
 */
export declare function useDraggable<T extends HTMLElement>(item: DragItem, dragDrop: ReturnType<typeof useDragDrop>): {
    ref: import("react").RefObject<T>;
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
};
/**
 * useDroppable hook
 *
 * Makes an element a drop target.
 */
export declare function useDroppable<T extends HTMLElement>(target: DropTarget, dragDrop: ReturnType<typeof useDragDrop>): {
    ref: import("react").RefObject<T>;
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isOver: boolean;
};
/**
 * File drop zone for importing files
 */
export declare function useFileDrop(onFiles: (files: File[]) => void): {
    isDragging: boolean;
    dragProps: {
        onDragEnter: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDragOver: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
};
export default useDragDrop;
//# sourceMappingURL=drag-drop.d.ts.map