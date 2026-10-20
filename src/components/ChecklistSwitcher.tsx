import { useState } from 'react';
import { useChecklistContext } from '../lib/useChecklistContext';
import { useAuth } from '../lib/useAuth';
import { IconChevronDown, IconPlus, IconX } from './icons';

export default function ChecklistSwitcher({ compact = false }: { compact?: boolean }) {
  const { events, checklists, currentChecklistId, currentChecklist, currentEvent, setCurrentChecklistId, createEvent, createChecklist } =
    useChecklistContext();
  const { isCoordinator } = useAuth();
  const [open, setOpen] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [addingChecklistFor, setAddingChecklistFor] = useState<string | null>(null);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [busy, setBusy] = useState(false);

  const checklistsByEvent = new Map<string, typeof checklists>();
  for (const c of checklists) {
    const list = checklistsByEvent.get(c.event_id) ?? [];
    list.push(c);
    checklistsByEvent.set(c.event_id, list);
  }

  async function handleAddEvent() {
    if (!newEventName.trim()) return;
    setBusy(true);
    const id = await createEvent(newEventName.trim(), newEventDate || null, null);
    setBusy(false);
    if (id) {
      setNewEventName('');
      setNewEventDate('');
      setAddingEvent(false);
      setAddingChecklistFor(id);
    }
  }

  async function handleAddChecklist(eventId: string) {
    if (!newChecklistName.trim()) return;
    setBusy(true);
    const id = await createChecklist(eventId, newChecklistName.trim());
    setBusy(false);
    if (id) {
      setNewChecklistName('');
      setAddingChecklistFor(null);
      setCurrentChecklistId(id);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-left hover:bg-hover ${
          compact ? 'text-[13.5px]' : ''
        }`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[12px] text-muted">{currentEvent?.name ?? 'No event yet'}</span>
          <span className="block truncate text-[14px] font-medium text-ink">{currentChecklist?.name ?? 'Pick a checklist'}</span>
        </span>
        <IconChevronDown size={14} className="shrink-0 text-muted" />
      </button>

      {open && (
        <div className="dialog-scrim flex items-end justify-center sm:items-center" onClick={() => setOpen(false)}>
          <div className="dialog max-h-[85vh] w-full overflow-y-auto p-5 sm:m-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">Events &amp; checklists</h2>
              <button onClick={() => setOpen(false)} className="icon-btn !border-0" aria-label="Close">
                <IconX size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="panel">
                  <div className="panelhead">
                    <span className="panel-title">{event.name}</span>
                    {event.event_date && <span className="text-[12px] text-muted">{event.event_date}</span>}
                  </div>
                  {(checklistsByEvent.get(event.id) ?? []).map((cl) => (
                    <button
                      key={cl.id}
                      onClick={() => {
                        setCurrentChecklistId(cl.id);
                        setOpen(false);
                      }}
                      className={`row w-full items-center justify-between text-left ${cl.id === currentChecklistId ? 'bg-pale' : ''}`}
                    >
                      <span className={`text-[14px] ${cl.id === currentChecklistId ? 'font-medium text-teal' : 'text-ink'}`}>{cl.name}</span>
                      {cl.id === currentChecklistId && <span className="text-[12px] text-teal">Current</span>}
                    </button>
                  ))}
                  {(checklistsByEvent.get(event.id) ?? []).length === 0 && (
                    <p className="row text-[13.5px] text-muted">No checklists yet</p>
                  )}

                  {isCoordinator && (
                    <div className="row">
                      {addingChecklistFor === event.id ? (
                        <div className="flex w-full items-center gap-2">
                          <input
                            value={newChecklistName}
                            onChange={(e) => setNewChecklistName(e.target.value)}
                            placeholder="Checklist name"
                            autoFocus
                            className="input"
                          />
                          <button onClick={() => handleAddChecklist(event.id)} disabled={busy} className="btn small">
                            Add
                          </button>
                          <button onClick={() => setAddingChecklistFor(null)} className="btn text small">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingChecklistFor(event.id)} className="btn text small">
                          <IconPlus size={12} /> New checklist
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {events.length === 0 && <p className="text-center text-[13.5px] text-muted">No events yet.</p>}

              {isCoordinator && (
                <div className="panel p-3">
                  {addingEvent ? (
                    <div className="space-y-2">
                      <input
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="Event name"
                        autoFocus
                        className="input"
                      />
                      <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="input" />
                      <div className="flex gap-2">
                        <button onClick={handleAddEvent} disabled={busy} className="btn small">
                          Create event
                        </button>
                        <button onClick={() => setAddingEvent(false)} className="btn text small">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingEvent(true)} className="btn secondary small w-full">
                      <IconPlus size={13} /> New event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
