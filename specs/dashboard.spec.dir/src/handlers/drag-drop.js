"use strict";
/**
speclang-header lines:5
id: @specs/dashboard
version: 1.0.0
layer: 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDragDrop = useDragDrop;
exports.useDraggable = useDraggable;
exports.useDroppable = useDroppable;
exports.useFileDrop = useFileDrop;
// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*
/**
 * Drag and Drop
 *
 * Provides drag and drop functionality for file tree and other UI elements.
 */
const react_1 = require("react");
/**
 * useDragDrop hook
 *
 * Provides drag and drop functionality.
 */
function useDragDrop(options = {}) {
    const { onDragStart, onDragEnd, onDrop, onDragOver } = options;
    const [state, setState] = (0, react_1.useState)({
        isDragging: false,
        draggedItem: null,
        dropTarget: null
    });
    const dragItemRef = (0, react_1.useRef)(null);
    /**
     * Start dragging an item
     */
    const startDrag = (0, react_1.useCallback)((item) => {
        dragItemRef.current = item;
        setState({
            isDragging: true,
            draggedItem: item,
            dropTarget: null
        });
        if (onDragStart) {
            onDragStart(item);
        }
    }, [onDragStart]);
    /**
     * End dragging
     */
    const endDrag = (0, react_1.useCallback)((success = false) => {
        const item = dragItemRef.current;
        if (item && onDragEnd) {
            onDragEnd(item, success);
        }
        dragItemRef.current = null;
        setState({
            isDragging: false,
            draggedItem: null,
            dropTarget: null
        });
    }, [onDragEnd]);
    /**
     * Set drop target
     */
    const setDropTarget = (0, react_1.useCallback)((target) => {
        setState(prev => ({ ...prev, dropTarget: target }));
    }, []);
    /**
     * Check if item can be dropped on target
     */
    const canDrop = (0, react_1.useCallback)((target) => {
        const { draggedItem } = state;
        if (!draggedItem)
            return false;
        return target.accepts.includes(draggedItem.type);
    }, [state.draggedItem]);
    /**
     * Handle drop
     */
    const handleDrop = (0, react_1.useCallback)((target) => {
        const { draggedItem } = state;
        if (!draggedItem || !canDrop(target)) {
            endDrag(false);
            return false;
        }
        if (onDrop) {
            onDrop(draggedItem, target);
        }
        endDrag(true);
        return true;
    }, [state.draggedItem, canDrop, onDrop, endDrag]);
    /**
     * Handle drag over
     */
    const handleDragOver = (0, react_1.useCallback)((target) => {
        const { draggedItem } = state;
        if (!draggedItem)
            return false;
        if (onDragOver) {
            onDragOver(draggedItem, target);
        }
        setDropTarget(target);
        return canDrop(target);
    }, [state.draggedItem, canDrop, onDragOver, setDropTarget]);
    return {
        // State
        isDragging: state.isDragging,
        draggedItem: state.draggedItem,
        dropTarget: state.dropTarget,
        // Methods
        startDrag,
        endDrag,
        setDropTarget,
        canDrop,
        handleDrop,
        handleDragOver
    };
}
/**
 * useDraggable hook
 *
 * Makes an element draggable.
 */
function useDraggable(item, dragDrop) {
    const ref = (0, react_1.useRef)(null);
    const handleDragStart = (0, react_1.useCallback)((e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        dragDrop.startDrag(item);
        // Create drag image
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(ref.current, rect.width / 2, rect.height / 2);
        }
    }, [item, dragDrop]);
    const handleDragEnd = (0, react_1.useCallback)(() => {
        dragDrop.endDrag();
    }, [dragDrop]);
    return {
        ref,
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd
    };
}
/**
 * useDroppable hook
 *
 * Makes an element a drop target.
 */
function useDroppable(target, dragDrop) {
    const ref = (0, react_1.useRef)(null);
    const isOverRef = (0, react_1.useRef)(false);
    const handleDragEnter = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragDrop.canDrop(target)) {
            isOverRef.current = true;
            dragDrop.setDropTarget(target);
        }
    }, [target, dragDrop]);
    const handleDragOver = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        if (dragDrop.canDrop(target)) {
            e.dataTransfer.dropEffect = 'move';
            dragDrop.handleDragOver(target);
        }
        else {
            e.dataTransfer.dropEffect = 'none';
        }
    }, [target, dragDrop]);
    const handleDragLeave = (0, react_1.useCallback)((e) => {
        // Only clear if actually leaving the drop zone
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
            const { clientX, clientY } = e;
            if (clientX < rect.left ||
                clientX > rect.right ||
                clientY < rect.top ||
                clientY > rect.bottom) {
                isOverRef.current = false;
                dragDrop.setDropTarget(null);
            }
        }
    }, [dragDrop]);
    const handleDrop = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        try {
            const data = e.dataTransfer.getData('application/json');
            const item = JSON.parse(data);
            // Update the target with actual item
            dragDrop.handleDrop({ ...target, id: item.id });
        }
        catch (error) {
            console.error('Drop error:', error);
        }
        isOverRef.current = false;
    }, [target, dragDrop]);
    return {
        ref,
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        isOver: dragDrop.dropTarget?.id === target.id
    };
}
/**
 * File drop zone for importing files
 */
function useFileDrop(onFiles) {
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const handleDragEnter = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    }, []);
    const handleDragLeave = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    const handleDragOver = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    const handleDrop = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFiles(files);
        }
    }, [onFiles]);
    return {
        isDragging,
        dragProps: {
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDrop
        }
    };
}
exports.default = useDragDrop;
//# sourceMappingURL=drag-drop.js.map