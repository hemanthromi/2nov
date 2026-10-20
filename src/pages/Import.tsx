import { useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useTaskData } from '../lib/useTaskData';
import { buildImportPlan, parseChecklistFile, applyImportPlan } from '../lib/importChecklist';
import type { ImportPlan, ImportResult } from '../lib/importChecklist';

export default function Import() {
  const { isCoordinator } = useAuth();
  const { categories, tasks, refresh } = useTaskData();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isCoordinator) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Only coordinators and admins can import or update tasks from a file.
      </div>
    );
  }

  const existingBySourceNo = new Map(
    tasks.filter((t) => t.source_no != null).map((t) => [t.source_no as number, t.id]),
  );
  const existingCategoryNames = categories.map((c) => c.name);

  async function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const rows = await parseChecklistFile(file);
      if (rows.length === 0) {
        setParseError('No rows could be read. Check that the file has Section and Task/Item columns.');
        setPlan(null);
        return;
      }
      setPlan(buildImportPlan(rows, existingCategoryNames, existingBySourceNo));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read this file');
      setPlan(null);
    }
  }

  async function handleConfirm() {
    if (!plan) return;
    setBusy(true);
    try {
      const res = await applyImportPlan(fileName, plan);
      setResult(res);
      setPlan(null);
      await refresh();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  const creates = plan?.items.filter((i) => i.action === 'create').length ?? 0;
  const updates = plan?.items.filter((i) => i.action === 'update').length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Import tasks</h1>
      <p className="text-sm text-slate-500">
        Upload an Excel (.xlsx) or CSV file with columns like No., Section, Task / Item, Type, Qty, Owner,
        Deadline, Priority, Status, Notes. Rows with a matching No. update that task; others are added as new.
      </p>

      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Choose file
        </button>
        {fileName && <p className="mt-2 text-sm text-slate-500">{fileName}</p>}
      </div>

      {parseError && <p className="text-sm text-red-600">{parseError}</p>}

      {plan && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>{creates} new task(s)</li>
            <li>{updates} task(s) will be updated</li>
            <li>{plan.newCategories.length} new category(ies): {plan.newCategories.join(', ') || 'none'}</li>
            <li>{plan.skipped.length} row(s) skipped</li>
          </ul>

          <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">#</th>
                  <th className="px-2 py-1.5">Section</th>
                  <th className="px-2 py-1.5">Title</th>
                  <th className="px-2 py-1.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.items.slice(0, 50).map((item, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5">{item.row.no ?? '—'}</td>
                    <td className="px-2 py-1.5">{item.row.section}</td>
                    <td className="px-2 py-1.5">{item.row.title}</td>
                    <td className="px-2 py-1.5">
                      <span className={item.action === 'create' ? 'text-brand-700' : 'text-amber-700'}>
                        {item.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plan.items.length > 50 && (
              <p className="p-2 text-center text-xs text-slate-400">
                Showing first 50 of {plan.items.length} rows
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setPlan(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? 'Importing...' : `Import ${plan.items.length} row(s)`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-medium">Import complete</p>
          <p>
            {result.created} created, {result.updated} updated, {result.skipped} skipped.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-red-700">
              <p className="font-medium">{result.errors.length} error(s):</p>
              <ul className="list-disc pl-5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
