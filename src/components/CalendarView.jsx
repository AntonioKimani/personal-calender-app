import React, { useEffect, useState } from 'react';
import { format, parseISO, isBefore } from 'date-fns';

// localStorage key: pc_events_{ownerEmail}
export default function CalendarView({ ownerEmail }) {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [ownerToOpen, setOwnerToOpen] = useState(ownerEmail);

  useEffect(() => {
    loadEvents(ownerToOpen);
  }, [ownerToOpen]);

  function storageKey(owner) {
    return `pc_events_${encodeURIComponent(owner)}`;
  }

  function loadEvents(owner) {
    const raw = localStorage.getItem(storageKey(owner));
    setEvents(raw ? JSON.parse(raw) : []);
  }

  function saveEvents(next) {
    setEvents(next);
    localStorage.setItem(storageKey(ownerToOpen), JSON.stringify(next));
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const eventsForHour = (hour) => {
    if (!selectedDate) return [];
    return events
      .filter((ev) => ev.date === selectedDate && ev.start && parseInt(ev.start.split(':')[0]) === hour)
      .sort((a, b) => (a.start > b.start ? 1 : -1));
  };

  const isPast = (dateStr) => {
    const today = new Date();
    const dt = parseISO(dateStr);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return isBefore(dt, todayStart); // strictly before today
  };

  const updateHourEvent = (hour, text) => {
    if (!selectedDate) return;
    const hourStr = hour.toString().padStart(2, '0') + ':00';
    const evIndex = events.findIndex((e) => e.date === selectedDate && e.start === hourStr);
    if (evIndex >= 0) {
      const updated = [...events];
      updated[evIndex].title = text;
      saveEvents(updated);
    } else if (text.trim()) {
      const newEv = {
        id: 'ev_' + Date.now(),
        date: selectedDate,
        start: hourStr,
        end: hourStr,
        title: text,
      };
      saveEvents([...events, newEv]);
    }
  };

  return (
    <div className="calendar-view">
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <strong>Signed in as:</strong> <span className="muted">{localStorage.getItem('pc_user')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={selectedDate || ''}
            onChange={handleDateChange}
            style={{ padding: 8, borderRadius: 8 }}
          />
          <input
            placeholder="Open calendar (owner email)"
            value={ownerToOpen}
            onChange={(e) => setOwnerToOpen(e.target.value)}
            style={{ padding: 8, borderRadius: 8 }}
          />
          <button className="btn btn-ghost" onClick={() => loadEvents(ownerToOpen)}>
            Open
          </button>
        </div>
      </div>

      <div className="time-grid">
        {Array.from({ length: 16 }).map((_, i) => {
          const hour = 7 + i;
          const slotEvents = eventsForHour(hour);
          const past = selectedDate ? isPast(selectedDate) : false;

          return (
            <div key={hour} className="hour-row">
              <div className="hour-label">{hour}:00</div>
              <div
                className="hour-slot"
                contentEditable={!past}
                suppressContentEditableWarning={true}
                onBlur={(e) => updateHourEvent(hour, e.target.innerText)}
              >
                {slotEvents.map((ev) => ev.title).join('\n')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boss remarks section at bottom */}
      <div className="remarks">
        <h4>Boss's Remarks</h4>
        <Remarks owner={ownerToOpen} selectedDate={selectedDate} />
      </div>
    </div>
  );
}

function Remarks({ owner, selectedDate }) {
  const key = `pc_remarks_${encodeURIComponent(owner)}`;
  const currentUser = localStorage.getItem('pc_user') || '';
  const isBoss = currentUser === owner;
  const [val, setVal] = useState(() => localStorage.getItem(key) || '');

  const past = selectedDate ? isBefore(parseISO(selectedDate), new Date(new Date().setHours(0, 0, 0, 0))) : false;

  const save = () => {
    localStorage.setItem(key, val);
    alert('Saved');
  };

  return (
    <div>
      <textarea
        rows={4}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        readOnly={!isBoss || past}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
      ></textarea>
      {isBoss && !past ? (
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save}>
            Save Remarks
          </button>
        </div>
      ) : (
        <div className="small muted" style={{ marginTop: 8 }}>
          {past ? 'Past day – remarks read-only.' : 'Only the boss can edit remarks.'}
        </div>
      )}
    </div>
  );
}
