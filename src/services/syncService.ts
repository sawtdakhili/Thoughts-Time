import { supabase } from '../lib/supabase';
import { Item, Todo, Event, Routine, Note } from '../types';
import { useAuthStore } from '../store/useAuthStore';

// Database row type (matches Supabase schema)
interface DatabaseItem {
  id: string;
  user_id: string;
  item_id: string;
  type: string;
  content: string;
  created_at: string;
  created_date: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  scheduled_time: string | null;
  has_time: boolean | null;
  parent_id: string | null;
  parent_type: string | null;
  depth_level: number | null;
  children: string[] | null;
  embedded_items: string[] | null;
  completion_link_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
  split_start_id: string | null;
  split_end_id: string | null;
  recurrence_pattern: any | null;
  routine_scheduled_time: string | null;
  streak: number | null;
  last_completed: string | null;
  link_previews: any | null;
  order_index: number | null;
}

// Transform app Item to database format
function itemToDatabaseFormat(item: Item): Omit<DatabaseItem, 'id' | 'user_id'> {
  const base = {
    item_id: item.id,
    type: item.type,
    content: item.content,
    created_at: item.createdAt.toISOString(),
    created_date: item.createdDate,
    updated_at: item.updatedAt.toISOString(),
    completed_at: item.completedAt ? item.completedAt.toISOString() : null,
    cancelled_at: item.cancelledAt ? item.cancelledAt.toISOString() : null,
    scheduled_time: null as string | null,
    has_time: null as boolean | null,
    parent_id: null as string | null,
    parent_type: null as string | null,
    depth_level: null as number | null,
    children: null as string[] | null,
    embedded_items: null as string[] | null,
    completion_link_id: null as string | null,
    start_time: null as string | null,
    end_time: null as string | null,
    is_all_day: null as boolean | null,
    split_start_id: null as string | null,
    split_end_id: null as string | null,
    recurrence_pattern: null as any | null,
    routine_scheduled_time: null as string | null,
    streak: null as number | null,
    last_completed: null as string | null,
    link_previews: null as any | null,
    order_index: null as number | null,
  };

  if (item.type === 'todo') {
    const todo = item as Todo;
    return {
      ...base,
      scheduled_time: todo.scheduledTime ? todo.scheduledTime.toISOString() : null,
      has_time: todo.hasTime,
      parent_id: todo.parentId,
      parent_type: todo.parentType,
      depth_level: todo.depthLevel,
      children: todo.children,
      embedded_items: todo.embeddedItems,
      completion_link_id: todo.completionLinkId,
    };
  } else if (item.type === 'event') {
    const event = item as Event;
    return {
      ...base,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      has_time: event.hasTime,
      is_all_day: event.isAllDay,
      split_start_id: event.splitStartId,
      split_end_id: event.splitEndId,
      embedded_items: event.embeddedItems,
      parent_id: event.parentId,
      parent_type: event.parentType,
      depth_level: event.depthLevel,
      children: event.children,
    };
  } else if (item.type === 'routine') {
    const routine = item as Routine;
    return {
      ...base,
      recurrence_pattern: routine.recurrencePattern,
      routine_scheduled_time: routine.scheduledTime,
      has_time: routine.hasTime,
      streak: routine.streak,
      last_completed: routine.lastCompleted ? routine.lastCompleted.toISOString() : null,
      embedded_items: routine.embeddedItems,
      parent_id: routine.parentId,
      parent_type: routine.parentType,
      depth_level: routine.depthLevel,
      children: routine.children,
    };
  } else {
    // note
    const note = item as Note;
    return {
      ...base,
      link_previews: note.linkPreviews,
      children: note.children,
      parent_id: note.parentId,
      parent_type: note.parentType,
      depth_level: note.depthLevel,
      order_index: note.orderIndex,
    };
  }
}

// Transform database format to app Item
function databaseToItemFormat(dbItem: DatabaseItem): Item {
  const base = {
    id: dbItem.item_id,
    userId: dbItem.user_id,
    type: dbItem.type as Item['type'],
    content: dbItem.content,
    createdAt: new Date(dbItem.created_at),
    createdDate: dbItem.created_date,
    updatedAt: new Date(dbItem.updated_at),
    completedAt: dbItem.completed_at ? new Date(dbItem.completed_at) : null,
    cancelledAt: dbItem.cancelled_at ? new Date(dbItem.cancelled_at) : null,
  };

  if (dbItem.type === 'todo') {
    return {
      ...base,
      type: 'todo',
      scheduledTime: dbItem.scheduled_time ? new Date(dbItem.scheduled_time) : null,
      hasTime: dbItem.has_time ?? false,
      parentId: dbItem.parent_id,
      parentType: dbItem.parent_type as Todo['parentType'],
      depthLevel: dbItem.depth_level ?? 0,
      children: dbItem.children ?? [],
      embeddedItems: dbItem.embedded_items ?? [],
      completionLinkId: dbItem.completion_link_id,
    } as Todo;
  } else if (dbItem.type === 'event') {
    return {
      ...base,
      type: 'event',
      startTime: new Date(dbItem.start_time!),
      endTime: new Date(dbItem.end_time!),
      hasTime: dbItem.has_time ?? false,
      isAllDay: dbItem.is_all_day ?? false,
      splitStartId: dbItem.split_start_id,
      splitEndId: dbItem.split_end_id,
      embeddedItems: dbItem.embedded_items ?? [],
      parentId: dbItem.parent_id,
      parentType: dbItem.parent_type as Event['parentType'],
      depthLevel: dbItem.depth_level ?? 0,
      children: dbItem.children ?? [],
    } as Event;
  } else if (dbItem.type === 'routine') {
    return {
      ...base,
      type: 'routine',
      recurrencePattern: dbItem.recurrence_pattern,
      scheduledTime: dbItem.routine_scheduled_time,
      hasTime: dbItem.has_time ?? false,
      streak: dbItem.streak ?? 0,
      lastCompleted: dbItem.last_completed ? new Date(dbItem.last_completed) : null,
      embeddedItems: dbItem.embedded_items ?? [],
      parentId: dbItem.parent_id,
      parentType: null,
      depthLevel: 0,
      children: dbItem.children ?? [],
    } as Routine;
  } else {
    // note
    return {
      ...base,
      type: 'note',
      linkPreviews: dbItem.link_previews ?? [],
      children: dbItem.children ?? [],
      parentId: dbItem.parent_id,
      parentType: dbItem.parent_type as Note['parentType'],
      depthLevel: dbItem.depth_level ?? 0,
      orderIndex: dbItem.order_index ?? 0,
    } as Note;
  }
}

// Fetch all items for current user
export async function fetchItems(): Promise<Item[]> {
  const userId = useAuthStore.getState().getUserId();

  if (userId === 'guest') {
    return [];
  }

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching items:', error);
    throw error;
  }

  return (data || []).map(databaseToItemFormat);
}

// Create a new item
export async function createItem(item: Item): Promise<void> {
  const userId = useAuthStore.getState().getUserId();

  if (userId === 'guest') {
    return; // Don't sync for guest users
  }

  const dbItem = {
    user_id: userId,
    ...itemToDatabaseFormat(item),
  };

  const { error } = await supabase.from('items').insert(dbItem);

  if (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

// Update an existing item
export async function updateItem(item: Item): Promise<void> {
  const userId = useAuthStore.getState().getUserId();

  if (userId === 'guest') {
    return; // Don't sync for guest users
  }

  const dbItem = itemToDatabaseFormat(item);

  const { error } = await supabase
    .from('items')
    .update(dbItem)
    .eq('user_id', userId)
    .eq('item_id', item.id);

  if (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

// Delete an item
export async function deleteItem(itemId: string): Promise<void> {
  const userId = useAuthStore.getState().getUserId();

  if (userId === 'guest') {
    return; // Don't sync for guest users
  }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

// Subscribe to realtime changes
export function subscribeToChanges(
  onInsert: (item: Item) => void,
  onUpdate: (item: Item) => void,
  onDelete: (itemId: string) => void
) {
  const userId = useAuthStore.getState().getUserId();

  if (userId === 'guest') {
    return () => {}; // No subscription for guest users
  }

  const channel = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const item = databaseToItemFormat(payload.new as DatabaseItem);
        onInsert(item);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const item = databaseToItemFormat(payload.new as DatabaseItem);
        onUpdate(item);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'items',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const itemId = (payload.old as DatabaseItem).item_id;
        onDelete(itemId);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}
