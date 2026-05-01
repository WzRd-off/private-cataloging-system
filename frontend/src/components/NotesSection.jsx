import { useState } from 'react';
import { IconPlus } from './icons';
import { formatDate } from '../utils/format';

export default function NotesSection({ notes, onAdd }) {
  const [draft, setDraft] = useState('');

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;
    await onAdd(text);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleAdd();
  };

  return (
    <div className="book-notes">
      <h3>
        Замітки
        <span className="notes-count">{notes.length}</span>
      </h3>

      {notes.length === 0 ? (
        <div className="notes-empty">
          <span>📝</span>
          Ще немає заміток. Додайте першу!
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note, i) => (
            <div className="note-item" key={note.id ?? i}>
              <p className="note-text">{note.text}</p>
              {note.created_at && (
                <p className="note-date">{formatDate(note.created_at)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="note-add">
        <textarea
          className="note-textarea"
          placeholder="Додати замітку…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!draft.trim()}
          style={{ alignSelf: 'flex-end' }}
        >
          <IconPlus /> Додати
        </button>
      </div>
    </div>
  );
}
