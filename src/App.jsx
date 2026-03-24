import { useState, useEffect } from 'react';
import {
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { MEMBERS, DAYS_CZ, MONTHS_CZ, USER_EMAILS } from './constants';
import Login from './Login';

// Reverse lookup: email → member key
const EMAIL_TO_KEY = Object.fromEntries(
  Object.entries(USER_EMAILS).map(([k, v]) => [v, k])
);

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() { return toDateStr(new Date()); }

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days = [];
  for (let i = startDow - 1; i >= 0; i--)
    days.push({ date: new Date(year, month, -i), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), current: true });
  while (days.length < 42) {
    const next = days.length - startDow - lastDay.getDate() + 1;
    days.push({ date: new Date(year, month + 1, next), current: false });
  }
  return days;
}

export default function App() {
  const [user,        setUser]        = useState(undefined); // undefined = loading
  const [events,      setEvents]      = useState([]);
  const [templates,   setTemplates]   = useState([]);
  const [curDate,     setCurDate]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [filters,     setFilters]     = useState(new Set(Object.keys(MEMBERS)));

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null));
  }, []);

  // Firestore listeners
  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, 'events'), snap =>
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, 'templates'), snap =>
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); };
  }, [user]);

  if (user === undefined) {
    return <div className="loading-screen"><div className="spinner" />Načítám…</div>;
  }
  if (!user) return <Login />;

  const currentMemberKey = EMAIL_TO_KEY[user.email] ?? 'vsichni';
  const year  = curDate.getFullYear();
  const month = curDate.getMonth();
  const today = todayStr();
  const calDays = getCalendarDays(year, month);

  function eventsForDay(ds) {
    return events
      .filter(e => e.date === ds && filters.has(e.member))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }

  function toggleFilter(key) {
    setFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openDay(ds) { setSelectedDay(ds); setShowModal(true); }

  async function addEvent(data) {
    await addDoc(collection(db, 'events'), { ...data, createdAt: new Date().toISOString() });
  }
  async function deleteEvent(id)      { await deleteDoc(doc(db, 'events', id)); }
  async function updateEvent(id, data){ await updateDoc(doc(db, 'events', id), data); }
  async function addTemplate(data)    { await addDoc(collection(db, 'templates'), data); }
  async function deleteTemplate(id)   { await deleteDoc(doc(db, 'templates', id)); }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">📅 Rodinný Kalendář</h1>
          <div className="header-right">
            <nav className="month-nav">
              <button onClick={() => setCurDate(new Date(year, month - 1, 1))}>‹</button>
              <span>{MONTHS_CZ[month]} {year}</span>
              <button onClick={() => setCurDate(new Date(year, month + 1, 1))}>›</button>
            </nav>
            <div className="user-badge" style={{ '--c': MEMBERS[currentMemberKey].color }}>
              <span>{MEMBERS[currentMemberKey].name[0]}</span>
            </div>
            <button className="logout-btn" onClick={() => signOut(auth)} title="Odhlásit se">
              ⎋
            </button>
          </div>
        </div>

        <div className="filter-chips">
          {Object.entries(MEMBERS).map(([key, m]) => (
            <button
              key={key}
              className={`filter-chip ${filters.has(key) ? 'on' : 'off'}`}
              style={{ '--c': m.color, '--l': m.light }}
              onClick={() => toggleFilter(key)}
            >
              <span className="chip-dot" />
              {m.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Calendar ── */}
      <main className="calendar-wrap">
        <div className="cal-grid">
          {DAYS_CZ.map(d => <div key={d} className="cal-head">{d}</div>)}

          {calDays.map(({ date, current }, i) => {
            const ds      = toDateStr(date);
            const dayEvts = eventsForDay(ds);
            const isToday = ds === today;

            return (
              <div
                key={i}
                className={`cal-cell ${!current ? 'dim' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => openDay(ds)}
              >
                <span className={`day-num ${isToday ? 'today-num' : ''}`}>
                  {date.getDate()}
                </span>
                <div className="cell-events">
                  {dayEvts.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      className="cell-event"
                      style={{ background: MEMBERS[e.member].color }}
                      title={`${MEMBERS[e.member].name}: ${e.time ? e.time + ' ' : ''}${e.title}`}
                    >
                      <span className="ev-time-cell">{e.time}</span>
                      <span className="ev-title-cell">{e.title}</span>
                    </div>
                  ))}
                  {dayEvts.length > 3 && (
                    <div className="ev-more">+{dayEvts.length - 3}</div>
                  )}
                </div>
                {/* Mobile: just dots */}
                <div className="cell-dots">
                  {dayEvts.slice(0, 5).map(e => (
                    <span key={e.id} className="cell-dot" style={{ background: MEMBERS[e.member].color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <button className="fab" onClick={() => openDay(today)} title="Přidat událost dnes">+</button>

      {showModal && (
        <DayModal
          dateStr={selectedDay}
          events={events.filter(e => e.date === selectedDay)}
          templates={templates}
          defaultMember={currentMemberKey}
          onAdd={addEvent}
          onDelete={deleteEvent}
          onUpdate={updateEvent}
          onAddTemplate={addTemplate}
          onDeleteTemplate={deleteTemplate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Day Modal ────────────────────────────────────────────────────────────────

function DayModal({
  dateStr, events, templates, defaultMember,
  onAdd, onDelete, onUpdate, onAddTemplate, onDeleteTemplate, onClose,
}) {
  const [title,   setTitle]   = useState('');
  const [member,  setMember]  = useState(defaultMember);
  const [useTime, setUseTime] = useState(false);
  const [time,    setTime]    = useState('09:00');
  const [date,    setDate]    = useState(dateStr);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [tmplMode, setTmplMode] = useState(false); // show template name input

  const sorted = [...events].sort((a, b) =>
    (a.time || '').localeCompare(b.time || '')
  );

  const displayDate = new Date(date + 'T12:00:00');
  const dateLabel = displayDate.toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function applyTemplate(t) {
    setTitle(t.title);
    setMember(t.member);
    if (t.time) { setUseTime(true); setTime(t.time); }
    else        { setUseTime(false); }
  }

  function startEdit(ev) {
    setEditId(ev.id);
    setTitle(ev.title);
    setMember(ev.member);
    setDate(ev.date);
    if (ev.time) { setUseTime(true); setTime(ev.time); }
    else         { setUseTime(false); }
  }

  function cancelEdit() {
    setEditId(null);
    setTitle('');
    setMember(defaultMember);
    setUseTime(false);
    setTime('09:00');
    setDate(dateStr);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const data = { title: title.trim(), member, date, time: useTime ? time : null };
    if (editId) {
      await onUpdate(editId, data);
      setEditId(null);
    } else {
      await onAdd(data);
    }
    setTitle('');
    setMember(defaultMember);
    setUseTime(false);
    setTime('09:00');
    setDate(dateStr);
    setSaving(false);
  }

  async function handleSaveTemplate() {
    if (!title.trim()) return;
    await onAddTemplate({
      title: title.trim(),
      member,
      time: useTime ? time : null,
    });
    setTmplMode(false);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-hdr">
          <h2>{dateLabel}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="templates-section">
            <p className="section-label">Rychlé přidání</p>
            <div className="template-chips">
              {templates.map(t => (
                <div key={t.id} className="tmpl-wrap">
                  <button
                    className="tmpl-chip"
                    style={{ '--c': MEMBERS[t.member].color, '--l': MEMBERS[t.member].light }}
                    onClick={() => applyTemplate(t)}
                  >
                    {t.time && <span className="tmpl-time">{t.time}</span>}
                    {t.title}
                    <span className="tmpl-who">{MEMBERS[t.member].name}</span>
                  </button>
                  <button
                    className="tmpl-del"
                    onClick={() => onDeleteTemplate(t.id)}
                    title="Smazat šablonu"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing events */}
        {sorted.length > 0 && (
          <div className="event-list">
            <p className="section-label">Události</p>
            {sorted.map(ev => (
              <div key={ev.id} className="event-row" style={{ borderLeftColor: MEMBERS[ev.member].color }}>
                <div className="event-info">
                  <span className="ev-member" style={{ color: MEMBERS[ev.member].color }}>
                    {MEMBERS[ev.member].name}
                  </span>
                  {ev.time && <span className="ev-badge">{ev.time}</span>}
                  <span className="ev-name">{ev.title}</span>
                </div>
                <div className="ev-actions">
                  <button className="icon-btn" onClick={() => startEdit(ev)} title="Upravit">✎</button>
                  <button className="icon-btn del" onClick={() => onDelete(ev.id)} title="Smazat">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sorted.length === 0 && templates.length === 0 && (
          <p className="no-events">Žádné události tento den.</p>
        )}

        {/* Add / edit form */}
        <div className="add-form">
          <h3>{editId ? 'Upravit událost' : 'Přidat událost'}</h3>

          <div className="member-row">
            {Object.entries(MEMBERS).map(([key, m]) => (
              <button
                key={key}
                className={`mem-btn ${member === key ? 'sel' : ''}`}
                style={{ '--c': m.color, '--l': m.light }}
                onClick={() => setMember(key)}
              >
                {m.name}
              </button>
            ))}
          </div>

          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <input
            className="form-input title-inp"
            type="text"
            placeholder="Název události…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />

          <div className="time-row">
            <label className="time-label">
              <input
                type="checkbox"
                checked={useTime}
                onChange={e => setUseTime(e.target.checked)}
              />
              Konkrétní čas
            </label>
            {useTime && (
              <input
                className="form-input time-inp"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            )}
          </div>

          <div className="form-actions">
            {editId ? (
              <button className="btn-cancel" onClick={cancelEdit}>Zrušit</button>
            ) : (
              title.trim() && (
                <button className="btn-tmpl" onClick={handleSaveTemplate} title="Uložit jako šablonu">
                  ☆ Šablona
                </button>
              )
            )}
            <button
              className="btn-add"
              style={{ '--c': MEMBERS[member].color }}
              onClick={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving ? '…' : editId ? 'Uložit' : 'Přidat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
