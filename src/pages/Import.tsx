import { useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useTaskData } from '../lib/useTaskData';
import { buildImportPlan, parseChecklistFile, applyImportPlan } from '../lib/importChecklist';
import type { ImportPlan, ImportResult } from '../lib/importChecklist';
import { IconDownload } from '../components/icons';

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
    return <div className="p-7 text-[14.5px] text-muted">Only coordinators and admins can import or update tasks from a file.</div>;
  }

  const existingBySourceNo = new Map(tasks.filter((t) => t.source_no != null).map((t) => [t.source_no as number, t.id]));
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
    <div className="mx-auto max-w-3xl space-y-4 px-3.5 py-5 md:px-7 md:py-7">
      <div>
        <h1>Import tasks</h1>
        <p className="page-sub">
          Upload an Excel (.xlsx) or CSV file with columns like No., Section, Task / Item, Type, Qty, Owner,
          Deadline, Priority, Status, Notes. Rows with a matching No. update that task; others are added as new.
        </p>
      </div>

      <div className="panel border-dashed p-9 text-center">
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
        <IconDownload size={22} className="mx-auto mb-2 text-muted" />
        <button onClick={() => fileRef.current?.click()} className="btn">
          Choose file
        </button>
        {fileName && <p className="mt-2 text-[14.5px] text-muted">{fileName}</p>}
      </div>

      {parseError && <p className="text-[14.5px] text-out">{parseError}</p>}

      {plan && (
        <div className="panel p-4">
          <h2 className="panel-title">Preview</h2>
          <ul className="mt-2 space-y-1 text-[14.5px] text-ink">
            <li>{creates} new task(s)</li>
            <li>{updates} task(s) will be updated</li>
            <li>
              {plan.newCategories.length} new category(ies): {plan.newCategories.join(', ') || 'none'}
            </li>
            <li>{plan.skipped.length} row(s) skipped</li>
          </ul>

          <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-soft text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Section</th>
                  <th className="px-2 py-1.5 font-medium">Title</th>
                  <th className="px-2 py-1.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plan.items.slice(0, 50).map((item, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 tabular-nums text-muted">{item.row.no ?? '—'}</td>
                    <td className="px-2 py-1.5">{item.row.section}</td>
                    <td className="px-2 py-1.5">{item.row.title}</td>
                    <td className="px-2 py-1.5">
                      <span className={item.action === 'create' ? 'tag teal' : 'tag warn'}>{item.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plan.items.length > 50 && <p className="p-2 text-center text-[13.5px] text-muted">Showing first 50 of {plan.items.length} rows</p>}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setPlan(null)} className="btn secondary">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={busy} className="btn">
              {busy ? 'Importing…' : `Import ${plan.items.length} row(s)`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="panel p-4">
          <p className="row-title">Import complete</p>
          <p className="row-meta mt-1">
            {result.created} created, {result.updated} updated, {result.skipped} skipped.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-[13.5px] text-out">
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
