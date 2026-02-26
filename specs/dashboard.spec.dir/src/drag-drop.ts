// SPECLANG-GENERATED: @specs/ui.dir/interactions.spec.md
// DO NOT EDIT MANUALLY
// Source: @ui/interactions-*

/**
 * Drag and Drop
 * 
 * Provides drag and drop functionality for file tree and other UI elements.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Types
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
export function useDragDrop(options: DragDropOptions = {}) {
  const {
    onDragStart,
    onDragEnd,
    onDrop,
    onDragOver
  } = options;

  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null
  });

  const dragItemRef = useRef<DragItem | null>(null);

  /**
   * Start dragging an item
   */
  const startDrag = useCallback((item: DragItem) => {
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
  const endDrag = useCallback((success: boolean = false) => {
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
  const setDropTarget = useCallback((target: DropTarget | null) => {
    setState(prev => ({ ...prev, dropTarget: target }));
  }, []);

  /**
   * Check if item can be dropped on target
   */
  const canDrop = useCallback((target: DropTarget): boolean => {
    const { draggedItem } = state;
    if (!draggedItem) return false;
    
    return target.accepts.includes(draggedItem.type);
  }, [state.draggedItem]);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((target: DropTarget) => {
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
  const handleDragOver = useCallback((target: DropTarget) => {
    const { draggedItem } = state;
    
    if (!draggedItem) return false;
    
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
export function useDraggable<T extends HTMLElement>(
  item: DragItem,
  dragDrop: ReturnType<typeof useDragDrop>
) {
  const ref = useRef<T>(null);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    
    dragDrop.startDrag(item);
    
    // Create drag image
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(ref.current, rect.width / 2, rect.height / 2);
    }
  }, [item, dragDrop]);

  const handleDragEnd = useCallback(() => {
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
export function useDroppable<T extends HTMLElement>(
  target: DropTarget,
  dragDrop: ReturnType<typeof useDragDrop>
) {
  const ref = useRef<T>(null);
  const isOverRef = useRef(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragDrop.canDrop(target)) {
      isOverRef.current = true;
      dragDrop.setDropTarget(target);
    }
  }, [target, dragDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (dragDrop.canDrop(target)) {
      e.dataTransfer.dropEffect = 'move';
      dragDrop.handleDragOver(target);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [target, dragDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the drop zone
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        isOverRef.current = false;
        dragDrop.setDropTarget(null);
      }
    }
  }, [dragDrop]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const item = JSON.parse(data) as DragItem;
      
      // Update the target with actual item
      dragDrop.handleDrop({ ...target, id: item.id });
    } catch (error) {
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
export function useFileDrop(
  onFiles: (files: File[]) => void
) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
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

export default useDragDrop;
