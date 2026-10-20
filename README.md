# RLD Matrushakti BVP Event — Task Tracker

A mobile- and web-friendly task tracker for the 2 November RLD Matrushakti BVP event
checklist. Tasks are grouped by category, can be assigned to one or more people at
once, support due dates, and can be bulk-imported or updated from an Excel/CSV file.

Built on the existing **Sampark** Supabase project (new `bvp_*` tables only —
nothing in the existing schema was touched).

## Features

- Categories and tasks seeded from `RLD_Matrushakti_BVP_Event_Checklist_v2.xlsx`
  (23 categories, 396 tasks).
- Add tasks/categories that aren't on the original checklist.
- Assign a task to multiple people, and bulk-assign many tasks to people at once.
- Due dates, priority, status, quantity, notes per task.
- Filter by category, status, priority, assignee, search text, overdue.
- Import/update tasks from `.xlsx` or `.csv` — matches existing rows by the
  checklist's `No.` column, creates anything new, and creates missing categories
  and people automatically.
- Responsive layout: sidebar nav on desktop, bottom tab bar on mobile, installable
  as a PWA on phones.
- Magic-link email sign-in (reuses Sampark's `profiles` / `app_role` auth).
  Admins and coordinators can edit; viewers can read and update status on tasks
  assigned to them.

## Local development

```bash
cp .env.example .env   # already points at the Sampark Supabase project
npm install
npm run dev
```

## Supabase

Project: **Sampark** (`xdyaesvhskvsumhllrzz`). New tables, all RLS-enabled:

- `bvp_categories`
- `bvp_tasks`
- `bvp_people` — assignable people, independent of login (like `tm_members`)
- `bvp_task_assignees` — many-to-many task ↔ person
- `bvp_import_log` — audit trail of file imports

Access follows the project's existing `app_role` convention: `admin` and
`coordinator` can create/edit/delete; any signed-in `profiles` row (including
`viewer`) can read, and can update the status of tasks they're assigned to.
