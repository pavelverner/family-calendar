import { useState, useEffect, useRef, useCallback } from 'react';

function useKeyboardHeight() {
  const [kbH, setKbH] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKbH(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return kbH;
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}
import {
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { MEMBERS, DAYS_CZ, MONTHS_CZ, CATEGORIES, REPEAT_OPTIONS, USER_EMAILS } from './constants';
import Login from './Login';

const EMAIL_TO_KEY = Object.fromEntries(
  Object.entries(USER_EMAILS).map(([k, v]) => [v, k])
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() { return toDateStr(new Date()); }

function getWeekStart(date) {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

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

function isEventOnDate(event, dateStr) {
  if (event.date === dateStr) return true;
  if (!event.repeat || event.repeat === 'none') return false;
  const orig   = new Date(event.date + 'T12:00:00');
  const target = new Date(dateStr + 'T12:00:00');
  if (target <= orig) return false;
  if (event.repeat === 'weekly') {
    const diff = Math.round((target - orig) / 86400000);
    return diff % 7 === 0;
  }
  if (event.repeat === 'monthly') {
    return orig.getDate() === target.getDate();
  }
  return false;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [user,        setUser]        = useState(undefined);
  const [events,      setEvents]      = useState([]);
  const [templates,   setTemplates]   = useState([]);
  const [curDate,     setCurDate]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [filters,     setFilters]     = useState(new Set(Object.keys(MEMBERS)));
  const [view,        setView]        = useState('month'); // 'month' | 'week'

  useEffect(() => onAuthStateChanged(auth, u => setUser(u ?? null)), []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, 'events'),    snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [user]);

  if (user === undefined) return <div className="loading-screen"><div className="spinner" />Načítám…</div>;
  if (!user) return <Login />;

  const currentMemberKey = EMAIL_TO_KEY[user.email] ?? 'vsichni';
  const [dark, setDark] = useDarkMode();
  const today = todayStr();

  function eventsForDay(ds) {
    return events
      .filter(e => isEventOnDate(e, ds) && filters.has(e.member))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }

  function toggleFilter(key) {
    setFilters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function openDay(ds) { setSelectedDay(ds); setShowModal(true); }

  async function addEvent(data)          { await addDoc(collection(db, 'events'), { ...data, createdAt: new Date().toISOString() }); }
  async function deleteEvent(id)         { await deleteDoc(doc(db, 'events', id)); }
  async function updateEvent(id, data)   { await updateDoc(doc(db, 'events', id), data); }
  async function addTemplate(data)       { await addDoc(collection(db, 'templates'), data); }
  async function deleteTemplate(id)      { await deleteDoc(doc(db, 'templates', id)); }

  // Header nav: month moves by month, week moves by 7 days
  function navPrev() {
    if (view === 'week') setCurDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    else setCurDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function navNext() {
    if (view === 'week') setCurDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    else setCurDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function navLabel() {
    if (view === 'month') return `${MONTHS_CZ[curDate.getMonth()]} ${curDate.getFullYear()}`;
    const mon = getWeekStart(curDate);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    const fmt = d => d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    return `${fmt(mon)} – ${fmt(sun)}`;
  }

  // Month grid
  const year  = curDate.getFullYear();
  const month = curDate.getMonth();
  const calDays = getCalendarDays(year, month);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-row1">
          <h1 className="app-title">📅 Rodinný Kalendář</h1>
          <div className="header-user">
            <div className="user-badge" style={{ '--c': MEMBERS[currentMemberKey].color }}>
              {MEMBERS[currentMemberKey].name[0]}
            </div>
            <button className="theme-btn" onClick={() => setDark(d => !d)} title="Tmavý režim">
              {dark ? '☀️' : '🌙'}
            </button>
            <button className="logout-btn" onClick={() => signOut(auth)} title="Odhlásit se">⎋</button>
          </div>
        </div>
        <div className="header-row2">
          <div className="view-toggle">
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Měsíc</button>
            <button className={view === 'week'  ? 'active' : ''} onClick={() => setView('week')}>Týden</button>
          </div>
          <nav className="month-nav">
            <button onClick={navPrev}>‹</button>
            <span>{navLabel()}</span>
            <button onClick={navNext}>›</button>
          </nav>
        </div>
        <div className="filter-chips">
          {Object.entries(MEMBERS).map(([key, m]) => (
            <button
              key={key}
              className={`filter-chip ${filters.has(key) ? 'on' : 'off'}`}
              style={{ '--c': m.color, '--l': m.light }}
              onClick={() => toggleFilter(key)}
            >
              <span className="chip-dot" />{m.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── Views ── */}
      {view === 'month' ? (
        <MonthView
          calDays={calDays}
          eventsForDay={eventsForDay}
          today={today}
          onOpenDay={openDay}
          onUpdateEvent={updateEvent}
        />
      ) : (
        <WeekView
          events={events}
          filters={filters}
          curDate={curDate}
          today={today}
          onOpenDay={openDay}
          onUpdateEvent={updateEvent}
        />
      )}

      {/* ── Upcoming ── */}
      <UpcomingEvents events={events} filters={filters} onOpenDay={openDay} />

      <button className="fab" onClick={() => openDay(today)}>+</button>

      {showModal && (
        <DayModal
          dateStr={selectedDay}
          events={events.filter(e => isEventOnDate(e, selectedDay))}
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

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({ calDays, eventsForDay, today, onOpenDay, onUpdateEvent }) {
  const [dragOverDs, setDragOverDs] = useState(null);

  return (
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
              className={`cal-cell ${!current ? 'dim' : ''} ${isToday ? 'today' : ''} ${dragOverDs === ds ? 'drag-over' : ''}`}
              onClick={() => onOpenDay(ds)}
              onDragOver={e => { e.preventDefault(); setDragOverDs(ds); }}
              onDragLeave={() => setDragOverDs(null)}
              onDrop={async e => {
                e.preventDefault();
                setDragOverDs(null);
                const id = e.dataTransfer.getData('eventId');
                if (id) await onUpdateEvent(id, { date: ds });
              }}
            >
              <span className={`day-num ${isToday ? 'today-num' : ''}`}>{date.getDate()}</span>
              <div className="cell-events">
                {dayEvts.slice(0, 3).map(e => (
                  <div
                    key={e.id}
                    className="cell-event"
                    style={{ background: MEMBERS[e.member].color }}
                    draggable={!e.repeat || e.repeat === 'none'}
                    onDragStart={ev => { ev.dataTransfer.setData('eventId', e.id); ev.stopPropagation(); }}
                    onClick={ev => ev.stopPropagation()}
                    title={`${MEMBERS[e.member].name}: ${e.time ? e.time + ' ' : ''}${e.title}`}
                  >
                    <span className="ev-cat">{CATEGORIES[e.category || 'none']?.icon}</span>
                    <span className="ev-time-cell">{e.time}</span>
                    <span className="ev-title-cell">{e.title}</span>
                    {e.repeat && e.repeat !== 'none' && <span className="ev-repeat">🔁</span>}
                  </div>
                ))}
                {dayEvts.length > 3 && <div className="ev-more">+{dayEvts.length - 3}</div>}
              </div>
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
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

const HOUR_H     = 56;
const START_HOUR = 6;
const END_HOUR   = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

function timeToY(time) {
  const [h, m] = time.split(':').map(Number);
  return (h - START_HOUR) * HOUR_H + (m / 60) * HOUR_H;
}

function WeekView({ events, filters, curDate, today, onOpenDay, onUpdateEvent }) {
  const monday = getWeekStart(curDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return { date: d, ds: toDateStr(d) };
  });

  const [dragOverDs, setDragOverDs] = useState(null);
  const scrollRef = useRef(null);

  // Scroll to 7:00 on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = HOUR_H;
  }, []);

  function dayEvents(ds) {
    return events.filter(e => isEventOnDate(e, ds) && filters.has(e.member));
  }

  return (
    <main className="week-view">
      {/* Day headers */}
      <div className="wv-headers">
        <div className="wv-gutter" />
        {weekDays.map(({ date, ds }) => (
          <div key={ds} className={`wv-col-head ${ds === today ? 'wv-today-head' : ''}`}>
            <span className="wv-dow">{DAYS_CZ[(date.getDay() + 6) % 7]}</span>
            <span className={`wv-date ${ds === today ? 'today-num' : ''}`}>{date.getDate()}</span>
          </div>
        ))}
      </div>

      {/* All-day row */}
      <div className="wv-allday-row">
        <div className="wv-gutter"><span className="wv-allday-lbl">celý den</span></div>
        {weekDays.map(({ ds }) => (
          <div key={ds} className="wv-allday-col" onClick={() => onOpenDay(ds)}>
            {dayEvents(ds).filter(e => !e.time).map(e => (
              <div key={e.id} className="wv-allday-ev" style={{ background: MEMBERS[e.member].color }}>
                {CATEGORIES[e.category || 'none']?.icon} {e.title}
                {e.repeat && e.repeat !== 'none' && ' 🔁'}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div className="wv-scroll" ref={scrollRef}>
        <div className="wv-grid" style={{ height: (END_HOUR - START_HOUR) * HOUR_H + 'px' }}>
          {/* Time labels */}
          <div className="wv-gutter wv-time-axis">
            {HOURS.map(h => (
              <div key={h} className="wv-time-label" style={{ top: (h - START_HOUR) * HOUR_H + 'px' }}>
                {h}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(({ ds }) => (
            <div
              key={ds}
              className={`wv-day-col ${ds === today ? 'wv-col-today' : ''} ${dragOverDs === ds ? 'drag-over' : ''}`}
              onClick={() => onOpenDay(ds)}
              onDragOver={e => { e.preventDefault(); setDragOverDs(ds); }}
              onDragLeave={() => setDragOverDs(null)}
              onDrop={async e => {
                e.preventDefault();
                setDragOverDs(null);
                const id = e.dataTransfer.getData('eventId');
                if (id) await onUpdateEvent(id, { date: ds });
              }}
            >
              {/* Hour lines */}
              {HOURS.map(h => (
                <div key={h} className="wv-hline" style={{ top: (h - START_HOUR) * HOUR_H + 'px' }} />
              ))}

              {/* Current time */}
              {ds === today && <CurrentTimeLine />}

              {/* Timed events */}
              {dayEvents(ds).filter(e => e.time).map(e => (
                <div
                  key={e.id}
                  className="wv-event"
                  style={{ top: timeToY(e.time) + 'px', background: MEMBERS[e.member].color }}
                  draggable={!e.repeat || e.repeat === 'none'}
                  onDragStart={ev => { ev.dataTransfer.setData('eventId', e.id); ev.stopPropagation(); }}
                  onClick={ev => { ev.stopPropagation(); onOpenDay(ds); }}
                  title={`${MEMBERS[e.member].name}: ${e.time} ${e.title}`}
                >
                  <span className="wv-ev-time">{e.time}</span>
                  <span className="wv-ev-title">{CATEGORIES[e.category || 'none']?.icon} {e.title}</span>
                  {e.repeat && e.repeat !== 'none' && <span> 🔁</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function CurrentTimeLine() {
  const [top, setTop] = useState(null);
  useEffect(() => {
    function calc() {
      const now = new Date();
      const t = (now.getHours() - START_HOUR) * HOUR_H + (now.getMinutes() / 60) * HOUR_H;
      setTop(t >= 0 ? t : null);
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);
  if (top === null) return null;
  return <div className="wv-now-line" style={{ top: top + 'px' }} />;
}

// ── Upcoming Events ───────────────────────────────────────────────────────────

function UpcomingEvents({ events, filters, onOpenDay }) {
  const today = todayStr();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return toDateStr(d);
  });

  const nowTime = new Date().toTimeString().slice(0, 5); // HH:MM

  const upcoming = days.flatMap(ds =>
    events
      .filter(e => {
        if (!isEventOnDate(e, ds) || !filters.has(e.member)) return false;
        // hide past timed events on today
        if (ds === today && e.time && e.time < nowTime) return false;
        return true;
      })
      .map(e => ({ ...e, ds }))
  ).sort((a, b) => a.ds !== b.ds ? a.ds.localeCompare(b.ds) : (a.time || '').localeCompare(b.time || ''));

  if (upcoming.length === 0) return null;

  function dayLabel(ds) {
    if (ds === today) return 'Dnes';
    const d = new Date(ds + 'T12:00:00');
    const diff = Math.round((d - new Date(today + 'T12:00:00')) / 86400000);
    if (diff === 1) return 'Zítra';
    return d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
  }

  return (
    <section className="upcoming">
      <h2 className="upcoming-title">Nadcházející</h2>
      <div className="upcoming-list">
        {upcoming.map(e => (
          <button
            key={e.id + e.ds}
            className="upcoming-item"
            style={{ '--c': MEMBERS[e.member].color, '--l': MEMBERS[e.member].light }}
            onClick={() => onOpenDay(e.ds)}
          >
            <span className="up-day">{dayLabel(e.ds)}</span>
            <span className="up-dot" />
            <span className="up-info">
              <span className="up-title">{CATEGORIES[e.category || 'none']?.icon} {e.title}</span>
              <span className="up-meta">{MEMBERS[e.member].name}{e.time && <> · {e.time}</>}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Day Modal (wizard) ────────────────────────────────────────────────────────

function DayModal({ dateStr, events, templates, defaultMember, onAdd, onDelete, onUpdate, onAddTemplate, onDeleteTemplate, onClose }) {
  const kbH = useKeyboardHeight();
  // mode: 'list' | 'step1' | 'step2'
  const [mode,     setMode]     = useState('list');
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  // Form state
  const [member,   setMember]   = useState(defaultMember);
  const [category, setCategory] = useState('none');
  const [title,    setTitle]    = useState('');
  const [date,     setDate]     = useState(dateStr);
  const [useTime,  setUseTime]  = useState(false);
  const [time,     setTime]     = useState('09:00');
  const [duration, setDuration] = useState(60); // minutes
  const [repeat,   setRepeat]   = useState('none');
  const [note,     setNote]     = useState('');
  const [showNote, setShowNote] = useState(false);

  const sorted = [...events].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const displayDate = new Date(dateStr + 'T12:00:00');
  const dateLabel = displayDate.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });

  function resetForm() {
    setMember(defaultMember); setCategory('none'); setTitle('');
    setDate(dateStr); setUseTime(false); setTime('09:00'); setDuration(60);
    setRepeat('none'); setNote(''); setShowNote(false); setEditId(null);
  }

  function openAdd() { resetForm(); setMode('step1'); }

  function startEdit(ev) {
    setEditId(ev.id); setMember(ev.member); setCategory(ev.category || 'none');
    setTitle(ev.title); setDate(ev.date); setRepeat(ev.repeat || 'none');
    setNote(ev.note || ''); setShowNote(!!ev.note); setDuration(ev.duration ?? 60);
    if (ev.time) { setUseTime(true); setTime(ev.time); } else { setUseTime(false); }
    setMode('step1');
  }

  async function applyTemplate(t) {
    const data = {
      title: t.title, member: t.member, category: t.category || 'none',
      note: t.note || '', date: dateStr,
      time: t.time || null, repeat: t.repeat || 'none',
    };
    await onAdd(data);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const data = { title: title.trim(), member, category, note, date, time: useTime ? time : null, duration: useTime ? duration : null, repeat };
    if (editId) await onUpdate(editId, data);
    else        await onAdd(data);
    onClose();
  }

  async function handleSaveTemplate() {
    if (!title.trim()) return;
    await onAddTemplate({ title: title.trim(), member, category, note, time: useTime ? time : null, repeat });
  }

  // ── Header ──
  const hdrTitle = mode === 'list' ? dateLabel
    : mode === 'step1' ? (editId ? 'Upravit událost' : 'Nová událost')
    : editId ? 'Upravit událost' : 'Nová událost';

  const hdrLeft = mode !== 'list' && (
    <button className="back-btn" onClick={() => mode === 'step2' ? setMode('step1') : setMode('list')}>
      ←
    </button>
  );

  // ── Render ──
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Handle + header — always visible */}
        <div className="modal-hdr">
          <div className="modal-hdr-left">
            {hdrLeft}
            <h2>{hdrTitle}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── LIST mode ── */}
        {mode === 'list' && (
          <div className="modal-list">
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
                        {CATEGORIES[t.category || 'none']?.icon} {t.title}
                        {t.time && <span className="tmpl-time"> {t.time}</span>}
                      </button>
                      <button className="tmpl-del" onClick={() => onDeleteTemplate(t.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {sorted.length > 0 && (
              <div className="event-list">
                {templates.length > 0 && <p className="section-label">Události</p>}
                {sorted.map(ev => (
                  <div key={ev.id} className="event-row" style={{ borderLeftColor: MEMBERS[ev.member].color }}>
                    <div className="event-info">
                      <span className="ev-cat-icon">{CATEGORIES[ev.category || 'none']?.icon}</span>
                      <span className="ev-member" style={{ color: MEMBERS[ev.member].color }}>{MEMBERS[ev.member].name}</span>
                      {ev.time && <span className="ev-badge">{ev.time}</span>}
                      {ev.repeat && ev.repeat !== 'none' && <span className="ev-badge">🔁</span>}
                      <span className="ev-name">{ev.title}</span>
                      {ev.note && <span className="ev-note-preview">{ev.note}</span>}
                    </div>
                    <div className="ev-actions">
                      <button className="icon-btn" onClick={() => startEdit(ev)}>✎</button>
                      <button className="icon-btn del" onClick={() => onDelete(ev.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sorted.length === 0 && templates.length === 0 && (
              <p className="no-events">Žádné události tento den.</p>
            )}

            {/* Add button */}
            <div className="list-footer">
              <button className="btn-new-event" onClick={openAdd}>
                + Přidat událost
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Kdo + Kategorie ── */}
        {mode === 'step1' && (
          <div className="wizard-step">
            <div className="wizard-body">
              <p className="step-label">Pro koho?</p>
              <div className="member-grid">
                {Object.entries(MEMBERS).map(([key, m]) => (
                  <button
                    key={key}
                    className={`mem-card ${member === key ? 'sel' : ''}`}
                    style={{ '--c': m.color, '--l': m.light }}
                    onClick={() => setMember(key)}
                  >
                    <span className="mem-card-avatar">{m.name[0]}</span>
                    <span className="mem-card-name">{m.name}</span>
                  </button>
                ))}
              </div>

              <p className="step-label" style={{ marginTop: 20 }}>Kategorie</p>
              <div className="cat-grid">
                {Object.entries(CATEGORIES).map(([key, c]) => (
                  <button
                    key={key}
                    className={`cat-card ${category === key ? 'sel' : ''}`}
                    onClick={() => setCategory(key)}
                  >
                    <span className="cat-card-icon">{c.icon}</span>
                    <span className="cat-card-label">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="wizard-footer" style={{ paddingBottom: kbH > 0 ? kbH + 12 + 'px' : undefined }}>
              <div className="wizard-dots">
                <span className="dot active" /><span className="dot" />
              </div>
              <button className="btn-next" style={{ '--c': MEMBERS[member].color }} onClick={() => setMode('step2')}>
                Dále →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Co + Kdy ── */}
        {mode === 'step2' && (
          <div className="wizard-step">
            <div className="wizard-body">
              <input
                className="form-input title-inp"
                type="text"
                placeholder="Název události…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />

              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />

              <div className="time-row">
                <button className={`time-toggle ${useTime ? 'on' : ''}`} onClick={() => setUseTime(v => !v)}>
                  <span className="time-toggle-knob" />
                </button>
                <span className="time-toggle-label" onClick={() => setUseTime(v => !v)}>Konkrétní čas</span>
                {useTime && (
                  <input className="form-input time-inp" type="time" step="900" value={time} onChange={e => setTime(e.target.value)} />
                )}
              </div>

              {useTime && (
                <div className="duration-row">
                  {[30, 60, 90, 120, 180].map(m => (
                    <button
                      key={m}
                      className={`duration-btn ${duration === m ? 'sel' : ''}`}
                      onClick={() => setDuration(m)}
                    >
                      {m < 60 ? `${m} min` : `${m / 60} hod`}
                    </button>
                  ))}
                  <button
                    className={`duration-btn ${duration === 0 ? 'sel' : ''}`}
                    onClick={() => setDuration(0)}
                  >
                    Celý den
                  </button>
                </div>
              )}

              <div className="repeat-row">
                {REPEAT_OPTIONS.map(o => (
                  <button key={o.value} className={`repeat-btn ${repeat === o.value ? 'sel' : ''}`}
                    onClick={() => setRepeat(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>

              {!showNote ? (
                <button className="btn-add-note" onClick={() => setShowNote(true)}>+ Přidat poznámku</button>
              ) : (
                <textarea
                  className="form-input note-inp"
                  placeholder="Poznámka…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  autoFocus
                />
              )}
            </div>

            <div className="wizard-footer" style={{ paddingBottom: kbH > 0 ? kbH + 12 + 'px' : undefined }}>
              <div className="wizard-dots">
                <span className="dot" /><span className="dot active" />
              </div>
              <div className="wizard-actions">
                {!editId && title.trim() && (
                  <button className="btn-tmpl" onClick={handleSaveTemplate}>☆</button>
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
        )}
      </div>
    </div>
  );
}
