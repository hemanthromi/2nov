import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Checklist, Event } from './types';

const STORAGE_KEY = 'bvp-active-checklist-id';

interface ChecklistContextState {
  events: Event[];
  checklists: Checklist[];
  loading: boolean;
  error: string | null;
  currentChecklistId: string | null;
  currentChecklist: Checklist | null;
  currentEvent: Event | null;
  setCurrentChecklistId: (id: string) => void;
  refresh: () => Promise<void>;
  createEvent: (name: string, eventDate: string | null, description: string | null) => Promise<string | null>;
  createChecklist: (eventId: string, name: string) => Promise<string | null>;
}

const ChecklistContext = createContext<ChecklistContextState | undefined>(undefined);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChecklistId, setCurrentChecklistIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  function setCurrentChecklistId(id: string) {
    setCurrentChecklistIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    const [eventsRes, checklistsRes] = await Promise.all([
      supabase.from('bvp_events').select('*').order('event_date', { ascending: false, nullsFirst: false }),
      supabase.from('bvp_checklists').select('*').order('created_at'),
    ]);
    if (eventsRes.error) {
      setError(eventsRes.error.message);
      setLoading(false);
      return;
    }
    if (checklistsRes.error) {
      setError(checklistsRes.error.message);
      setLoading(false);
      return;
    }
    const eventList = (eventsRes.data ?? []) as Event[];
    const checklistList = (checklistsRes.data ?? []) as Checklist[];
    setEvents(eventList);
    setChecklists(checklistList);

    setCurrentChecklistIdState((prev) => {
      if (prev && checklistList.some((c) => c.id === prev)) return prev;
      const fallback = checklistList[0]?.id ?? null;
      if (fallback) {
        try {
          localStorage.setItem(STORAGE_KEY, fallback);
        } catch {
          /* ignore */
        }
      }
      return fallback;
    });

    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createEvent(name: string, eventDate: string | null, description: string | null): Promise<string | null> {
    const { data, error } = await supabase
      .from('bvp_events')
      .insert({ name, event_date: eventDate, description })
      .select('id')
      .single();
    if (error) {
      setError(error.message);
      return null;
    }
    await refresh();
    return data.id;
  }

  async function createChecklist(eventId: string, name: string): Promise<string | null> {
    const { data, error } = await supabase.from('bvp_checklists').insert({ event_id: eventId, name }).select('id').single();
    if (error) {
      setError(error.message);
      return null;
    }
    await refresh();
    return data.id;
  }

  const currentChecklist = checklists.find((c) => c.id === currentChecklistId) ?? null;
  const currentEvent = events.find((e) => e.id === currentChecklist?.event_id) ?? null;

  return (
    <ChecklistContext.Provider
      value={{
        events,
        checklists,
        loading,
        error,
        currentChecklistId,
        currentChecklist,
        currentEvent,
        setCurrentChecklistId,
        refresh,
        createEvent,
        createChecklist,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklistContext() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error('useChecklistContext must be used within ChecklistProvider');
  return ctx;
}
