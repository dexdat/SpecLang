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
    isDragging: any;
    draggedItem: any;
    dropTarget: any;
    startDrag: any;
    endDrag: any;
    setDropTarget: any;
    canDrop: any;
    handleDrop: any;
    handleDragOver: any;
};
/**
 * useDraggable hook
 *
 * Makes an element draggable.
 */
export declare function useDraggable<T extends HTMLElement>(item: DragItem, dragDrop: ReturnType<typeof useDragDrop>): {
    ref: any;
    draggable: boolean;
    onDragStart: any;
    onDragEnd: any;
};
/**
 * useDroppable hook
 *
 * Makes an element a drop target.
 */
export declare function useDroppable<T extends HTMLElement>(target: DropTarget, dragDrop: ReturnType<typeof useDragDrop>): {
    ref: any;
    onDragEnter: any;
    onDragOver: any;
    onDragLeave: any;
    onDrop: any;
    isOver: boolean;
};
/**
 * File drop zone for importing files
 */
export declare function useFileDrop(onFiles: (files: File[]) => void): {
    isDragging: any;
    dragProps: {
        onDragEnter: any;
        onDragLeave: any;
        onDragOver: any;
        onDrop: any;
    };
};
export default useDragDrop;
//# sourceMappingURL=drag-drop.d.ts.map