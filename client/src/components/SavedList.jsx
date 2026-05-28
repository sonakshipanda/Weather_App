import { useState } from 'react';
import { api } from '../api/client.js';

export default function SavedList({ items, onRefresh, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!items) return null;

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      location: item.locationQuery || '',
      startDate: item.dateRange?.start || '',
      endDate: item.dateRange?.end || '',
      notes: item.notes || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
  }

  async function submitEdit(originalItem) {
    setSaving(true);
    try {
      // Only send fields that changed — keeps notes-only edits fast (no re-fetch on server).
      const patch = {};
      if (form.location !== originalItem.locationQuery) patch.location = form.location;
      if (form.startDate !== originalItem.dateRange?.start) patch.startDate = form.startDate;
      if (form.endDate !== originalItem.dateRange?.end) patch.endDate = form.endDate;
      if (form.notes !== (originalItem.notes || '')) patch.notes = form.notes;

      if (Object.keys(patch).length === 0) {
        cancelEdit();
        return;
      }

      await onUpdate?.(originalItem._id, patch);
      cancelEdit();
    } catch {
      // App.jsx already surfaced the error; leave the form open so the user can fix + retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="saved">
      <div className="saved-header">
        <h2 className="eyebrow" style={{ margin: 0 }}>Saved · {items.length}</h2>
        <div className="export-row">
          <a href={api.exportUrl('json')}>JSON</a>
          <a href={api.exportUrl('csv')}>CSV</a>
          <a href={api.exportUrl('xml')}>XML</a>
          <a href={api.exportUrl('md')}>MD</a>
          <a href={api.exportUrl('pdf')}>PDF</a>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="saved-empty">No saved queries yet — save one from a search above.</div>
      ) : (
        <ul className="saved-list">
          {items.map((q) =>
            editingId === q._id ? (
              <EditRow
                key={q._id}
                item={q}
                form={form}
                setForm={setForm}
                saving={saving}
                onCancel={cancelEdit}
                onSubmit={() => submitEdit(q)}
              />
            ) : (
              <ReadRow
                key={q._id}
                item={q}
                disabled={editingId !== null}
                onEdit={() => startEdit(q)}
                onDelete={() => onDelete?.(q._id)}
              />
            ),
          )}
        </ul>
      )}

      <button
        className="btn-quiet"
        style={{ marginTop: 16 }}
        onClick={onRefresh}
        disabled={editingId !== null}
      >
        Refresh
      </button>
    </section>
  );
}

function ReadRow({ item, disabled, onEdit, onDelete }) {
  return (
    <li className="saved-item">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="place">{item.displayName}</div>
        <div className="meta">
          {item.dateRange?.start} → {item.dateRange?.end}
          {item.current ? ` · ${Math.round(item.current.temperatureC)}° ${item.current.condition}` : ''}
        </div>
        {item.notes && <div className="notes">“{item.notes}”</div>}
        {item.aiTip && <div className="tip">{item.aiTip}</div>}
      </div>
      <div className="row-actions">
        <button className="btn-quiet" onClick={onEdit} disabled={disabled}>
          Edit
        </button>
        <span className="dot">·</span>
        <button className="btn-quiet" onClick={onDelete} disabled={disabled}>
          Delete
        </button>
      </div>
    </li>
  );
}

function EditRow({ item, form, setForm, saving, onCancel, onSubmit }) {
  const handle = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const changesNeedRefetch =
    form.location !== item.locationQuery ||
    form.startDate !== item.dateRange?.start ||
    form.endDate !== item.dateRange?.end;

  return (
    <li className="saved-item edit-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="place" style={{ marginBottom: 14 }}>
          {item.displayName}
        </div>

        <div className="edit-form">
          <label>
            <span className="lbl">Location</span>
            <input
              type="text"
              value={form.location}
              onChange={handle('location')}
              placeholder="City, zip, coords, or landmark"
            />
          </label>

          <div className="edit-row-grid">
            <label>
              <span className="lbl">Start date</span>
              <input type="date" value={form.startDate} onChange={handle('startDate')} />
            </label>
            <label>
              <span className="lbl">End date</span>
              <input type="date" value={form.endDate} onChange={handle('endDate')} />
            </label>
          </div>

          <label>
            <span className="lbl">Notes</span>
            <textarea
              value={form.notes}
              onChange={handle('notes')}
              placeholder="Optional — anything to remember about this query"
            />
          </label>

          {changesNeedRefetch && (
            <div className="edit-hint">
              Changing location or dates will re-fetch weather and regenerate the AI tip.
            </div>
          )}

          <div className="edit-actions">
            <button className="btn-quiet" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={onSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
