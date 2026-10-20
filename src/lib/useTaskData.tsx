import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Category, Person, Task, TaskAssignee } from './types';

interface TaskDataState {
  categories: Category[];
  people: Person[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTaskData(): TaskDataState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, peopleRes, taskRes, assigneeRes] = await Promise.all([
        supabase.from('bvp_categories').select('*').order('sort'),
        supabase.from('bvp_people').select('*').order('name'),
        supabase.from('bvp_tasks').select('*').order('source_no', { nullsFirst: false }).order('created_at'),
        supabase.from('bvp_task_assignees').select('task_id, person_id, assigned_at'),
      ]);

      if (catRes.error) throw catRes.error;
      if (peopleRes.error) throw peopleRes.error;
      if (taskRes.error) throw taskRes.error;
      if (assigneeRes.error) throw assigneeRes.error;

      const peopleList = (peopleRes.data ?? []) as Person[];
      const peopleById = new Map(peopleList.map((p) => [p.id, p]));

      const assigneesByTask = new Map<string, TaskAssignee[]>();
      for (const row of (assigneeRes.data ?? []) as TaskAssignee[]) {
        const list = assigneesByTask.get(row.task_id) ?? [];
        list.push({ ...row, person: peopleById.get(row.person_id) });
        assigneesByTask.set(row.task_id, list);
      }

      const taskList = ((taskRes.data ?? []) as Task[]).map((t) => ({
        ...t,
        assignees: assigneesByTask.get(t.id) ?? [],
      }));

      setCategories((catRes.data ?? []) as Category[]);
      setPeople(peopleList);
      setTasks(taskList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, people, tasks, loading, error, refresh };
}
