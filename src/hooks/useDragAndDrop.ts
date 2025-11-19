import { useState } from 'react';
import {
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, Todo } from '../types';
import { useStore } from '../store/useStore';

export interface DragData {
  itemId: string;
  item: Item;
  sourcePane: 'thoughts' | 'time';
}

export interface DropData {
  date: string;
  time?: string; // Optional time (HH:mm format)
  targetPane: 'thoughts' | 'time';
}

export function useDragAndDropContext() {
  const [activeItem, setActiveItem] = useState<DragData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const updateItem = useStore((state) => state.updateItem);
  const items = useStore((state) => state.items);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    setActiveItem(data);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      setOverId(null);
      return;
    }

    const dragData = active.data.current as DragData;
    const dropData = over.data.current as DropData;

    // CONSTRAINT: Cannot drag from Time to Thoughts (cannot "unschedule" by dragging)
    if (dragData.sourcePane === 'time' && dropData.targetPane === 'thoughts') {
      console.warn('Cannot drag items from Time back to Thoughts');
      setActiveItem(null);
      setOverId(null);
      return;
    }

    // CONSTRAINT: Can only drag TO Time pane
    if (dropData.targetPane !== 'time') {
      setActiveItem(null);
      setOverId(null);
      return;
    }

    // Schedule the item
    if (dragData.item.type === 'todo') {
      const todo = dragData.item as Todo;

      // Parse the drop time
      let scheduledTime: Date;
      if (dropData.time) {
        // Specific time provided
        const [hours, minutes] = dropData.time.split(':').map(Number);
        scheduledTime = new Date(dropData.date);
        scheduledTime.setHours(hours, minutes, 0, 0);
      } else {
        // No specific time, use 9 AM default
        scheduledTime = new Date(dropData.date);
        scheduledTime.setHours(9, 0, 0, 0);
      }

      // Update the todo with scheduled time
      updateItem(todo.id, {
        scheduledTime,
        hasTime: true,
      });

      // If this todo has subtasks, update them too
      if (todo.subtasks && todo.subtasks.length > 0) {
        todo.subtasks.forEach((subtaskId) => {
          const subtask = items.find(i => i.id === subtaskId);
          if (subtask && subtask.type === 'todo') {
            updateItem(subtaskId, {
              scheduledTime,
              hasTime: true,
            });
          }
        });
      }
    } else if (dragData.item.type === 'event') {
      // For events, update start time
      const event = dragData.item;

      let startTime: Date;
      if (dropData.time) {
        const [hours, minutes] = dropData.time.split(':').map(Number);
        startTime = new Date(dropData.date);
        startTime.setHours(hours, minutes, 0, 0);
      } else {
        startTime = new Date(dropData.date);
        startTime.setHours(9, 0, 0, 0);
      }

      // Calculate duration
      const currentStart = new Date(event.startTime);
      const currentEnd = new Date(event.endTime);
      const durationMs = currentEnd.getTime() - currentStart.getTime();

      const endTime = new Date(startTime.getTime() + durationMs);

      updateItem(event.id, {
        startTime,
        endTime,
        hasTime: true,
      });
    }

    setActiveItem(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setOverId(null);
  };

  return {
    activeItem,
    overId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

export function useDraggableItem(itemId: string, item: Item, sourcePane: 'thoughts' | 'time') {
  // CONSTRAINT: Cannot drag completed items
  const isDraggable = !(item.type === 'todo' && (item as Todo).completedAt);

  // CONSTRAINT: Cannot drag subtasks independently (parent todo brings all subtasks)
  const isSubtask = item.type === 'todo' && (item as Todo).parentId;
  const canDrag = isDraggable && !isSubtask;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: itemId,
    data: {
      itemId,
      item,
      sourcePane,
    } as DragData,
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: canDrag ? 'grab' : 'default',
      }
    : {
        cursor: canDrag ? 'grab' : 'default',
      };

  return {
    setNodeRef,
    attributes,
    listeners: canDrag ? listeners : {},
    style,
    isDragging,
    canDrag,
  };
}

export function useDroppableZone(dropId: string, date: string, time?: string, targetPane: 'thoughts' | 'time' = 'time') {
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: {
      date,
      time,
      targetPane,
    } as DropData,
  });

  const style = {
    backgroundColor: isOver ? 'var(--hover-bg, #0F0F0F)' : 'transparent',
    border: isOver ? '1px dashed var(--text-secondary, #6A6A6A)' : '1px dashed transparent',
    transition: 'all 0.2s ease',
  };

  return {
    setNodeRef,
    isOver,
    style,
  };
}
