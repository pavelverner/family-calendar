import { useState, useEffect, useRef, useCallback, memo } from 'react';

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

function useSwipe(onLeft, onRight, minDist = 55) {
  const startX = useRef(null);
  const startY = useRef(null);
  return {
    onTouchStart: e => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: e => {
      if (startX.current === null) return;
      const dx = startX.current - e.changedTouches[0].clientX;
      const dy = Math.abs(startY.current - e.changedTouches[0].clientY);
      if (Math.abs(dx) > minDist && Math.abs(dx) > dy) {
        dx > 0 ? onLeft() : onRight();
      }
      startX.current = null;
    },
  };
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
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, setDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { MEMBERS, DAYS_CZ, MONTHS_CZ, CATEGORIES, REPEAT_OPTIONS, USER_EMAILS, STATUSES } from './constants';
import Login from './Login';
import { EliskaAvatar, PavelAvatar, FilipAvatar, VsichniAvatar } from './Avatars';
import ChoresView from './Chores';
import { STATUS_ICON_COMPONENTS } from './StatusIcons';

// Render either a custom SVG icon or an emoji for a status definition
function StatusIcon({ statusDef, size = 22, className = '' }) {
  if (!statusDef) return null;
  const Comp = statusDef.iconKey && STATUS_ICON_COMPONENTS[statusDef.iconKey];
  if (Comp) return <Comp size={size} />;
  if (statusDef.emoji) return <span className={className}>{statusDef.emoji}</span>;
  return null;
}

// ── Drum-roll time picker ──────────────────────────────────────────────────────

const DrumPicker = memo(function DrumPicker({ items, value, onChange, itemH = 52, fontSize = '2rem' }) {
  const scrollRef = useRef(null);
  const settling  = useRef(false);
  const timerRef  = useRef(null);

  // Sync scroll to value when NOT user-scrolling
  useEffect(() => {
    if (settling.current) return;
    const idx = items.indexOf(value);
    if (scrollRef.current && idx >= 0) {
      scrollRef.current.scrollTop = idx * itemH;
    }
  }, [value, items, itemH]);

  function handleScroll() {
    settling.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      settling.current = false;
      if (!scrollRef.current) return;
      const idx = Math.round(scrollRef.current.scrollTop / itemH);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      onChange(items[clamped]);
    }, 180);
  }

  return (
    <div className="drum-outer" style={{ height: 3 * itemH + 'px' }}>
      <div
        ref={scrollRef}
        className="drum-scroll"
        onScroll={handleScroll}
        style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
      >
        <div style={{ height: itemH + 'px', flexShrink: 0 }} />
        {items.map(item => (
          <div
            key={item}
            className={`drum-item ${item === value ? 'sel' : ''}`}
            style={{ height: itemH + 'px', scrollSnapAlign: 'center', fontSize, fontWeight: item === value ? 800 : 500 }}
          >
            {String(item).padStart(2, '0')}
          </div>
        ))}
        <div style={{ height: itemH + 'px', flexShrink: 0 }} />
      </div>
      <div className="drum-line" style={{ top: itemH + 'px' }} />
      <div className="drum-line" style={{ top: 2 * itemH + 'px' }} />
    </div>
  );
});

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function TimePicker({ value, onChange }) {
  const h = parseInt(value?.split(':')[0] ?? '13') || 0;
  const m = parseInt(value?.split(':')[1] ?? '0')  || 0;
  // Round m to nearest 5-minute slot
  const mSnap = MINUTES.reduce((best, v) => Math.abs(v - m) < Math.abs(best - m) ? v : best, MINUTES[0]);

  return (
    <div className="drum-timepicker">
      <DrumPicker items={HOURS}   value={h}     onChange={v => onChange(`${String(v).padStart(2,'0')}:${String(mSnap).padStart(2,'00')}`)} itemH={52} fontSize="2.2rem" />
      <span className="drum-sep">:</span>
      <DrumPicker items={MINUTES} value={mSnap} onChange={v => onChange(`${String(h).padStart(2,'0')}:${String(v).padStart(2,'00')}`)}     itemH={44} fontSize="1.6rem" />
    </div>
  );
}

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
  if (event.endDate && event.endDate > event.date) {
    return dateStr >= event.date && dateStr <= event.endDate;
  }
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

function multiDayPos(event, dateStr) {
  if (!event.endDate || event.endDate <= event.date) return null;
  if (dateStr === event.date) return 'start';
  if (dateStr === event.endDate) return 'end';
  return 'mid';
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [user,             setUser]             = useState(undefined);
  const [events,           setEvents]           = useState([]);
  const [templates,        setTemplates]        = useState([]);
  const [statuses,         setStatuses]         = useState({});
  const [curDate,          setCurDate]          = useState(new Date());
  const [selectedDay,      setSelectedDay]      = useState(null);
  const [showModal,        setShowModal]        = useState(false);
  const [initialEditEvent, setInitialEditEvent] = useState(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [filters,          setFilters]          = useState(new Set(Object.keys(MEMBERS)));
  const [view,             setView]             = useState('month'); // 'month' | 'week' | 'chores'
  const [animDir,          setAnimDir]          = useState('next');
  const [dark, setDark] = useDarkMode();

  useEffect(() => onAuthStateChanged(auth, u => setUser(u ?? null)), []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, 'events'),    snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, 'statuses'),  snap => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const sep = d.id.indexOf('_');
        if (sep > 0) {
          const mk = d.id.slice(0, sep);
          const ds = d.id.slice(sep + 1);
          if (!map[mk]) map[mk] = {};
          map[mk][ds] = data;
        }
      });
      setStatuses(map);
    });
    return () => { u1(); u2(); u3(); };
  }, [user]);

  if (user === undefined) return <div className="loading-screen"><div className="spinner" />Načítám…</div>;
  if (!user) return <Login />;

  const currentMemberKey = EMAIL_TO_KEY[user.email] ?? 'vsichni';
  const today = todayStr();

  function eventsForDay(ds) {
    return events
      .filter(e => isEventOnDate(e, ds) && filters.has(e.member))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }

  function toggleFilter(key) {
    setFilters(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function openDay(ds) { setSelectedDay(ds); setInitialEditEvent(null); setShowModal(true); }

  function openNewEvent() { setSelectedDay(null); setInitialEditEvent(null); setShowModal(true); }

  function openEvent(ev) {
    setSelectedDay(ev.date);
    setInitialEditEvent(ev);
    setShowModal(true);
  }

  async function addEvent(data)          { await addDoc(collection(db, 'events'), { ...data, createdAt: new Date().toISOString() }); }
  async function deleteEvent(id)         { await deleteDoc(doc(db, 'events', id)); }
  async function updateEvent(id, data)   { await updateDoc(doc(db, 'events', id), data); }
  async function addTemplate(data)       { await addDoc(collection(db, 'templates'), data); }
  async function deleteTemplate(id)      { await deleteDoc(doc(db, 'templates', id)); }

  async function saveStatusForDate(statusKey, detail = '', forDate = todayStr()) {
    const docId = `${currentMemberKey}_${forDate}`;
    if (statusKey === 'none') {
      await deleteDoc(doc(db, 'statuses', docId));
    } else {
      await setDoc(doc(db, 'statuses', docId), {
        member: currentMemberKey,
        date: forDate,
        status: statusKey,
        detail,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async function saveStatus(statusKey, detail = '') {
    await saveStatusForDate(statusKey, detail);
    setShowStatusPicker(false);
  }

  // Header nav
  function navPrev() {
    setAnimDir('prev');
    if (view === 'week') setCurDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    else setCurDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function navNext() {
    setAnimDir('next');
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

  const myStatus   = statuses[currentMemberKey]?.[today];
  const myStatusDef = STATUSES.find(s => s.key === myStatus?.status);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-row1">
          <h1 className="app-title">📅 Vernouščí Kalendář</h1>
          <div className="header-user">
            {/* User avatar — tap to set status */}
            <button
              className="user-badge-btn"
              onClick={() => setShowStatusPicker(true)}
              title="Nastavit status"
            >
              <div className="user-badge">
                {currentMemberKey === 'eliska' ? <EliskaAvatar size={30} /> :
                 currentMemberKey === 'pavel'  ? <PavelAvatar  size={30} /> :
                 <span style={{ color: '#fff', fontWeight: 800, fontSize: '.85rem' }}>{MEMBERS[currentMemberKey].name[0]}</span>}
              </div>
              {myStatusDef && myStatusDef.key !== 'none' && (
                <span className="user-status-badge">
                  <StatusIcon statusDef={myStatusDef} size={14} />
                </span>
              )}
            </button>
            <button className="theme-btn" onClick={() => setDark(d => !d)} title="Tmavý režim">
              {dark ? '☀️' : '🌙'}
            </button>
            <button className="logout-btn" onClick={() => signOut(auth)} title="Odhlásit se">⎋</button>
          </div>
        </div>

        {/* View toggle + nav */}
        <div className="header-row2">
          <div className="view-toggle">
            <button className={view === 'month'  ? 'active' : ''} onClick={() => setView('month')}>Měsíc</button>
            <button className={view === 'week'   ? 'active' : ''} onClick={() => setView('week')}>Týden</button>
            <button className={view === 'chores' ? 'active' : ''} onClick={() => setView('chores')}>Domácnost</button>
          </div>
          {view !== 'chores' && (
            <nav className="month-nav">
              <button onClick={navPrev}>‹</button>
              <span>{navLabel()}</span>
              <button onClick={navNext}>›</button>
            </nav>
          )}
        </div>

        {view !== 'chores' && (
          <div className="filter-chips">
            {Object.entries(MEMBERS).map(([key, m]) => {
              const st = statuses[key]?.[today];
              const stDef = STATUSES.find(s => s.key === st?.status);
              return (
                <button
                  key={key}
                  className={`filter-chip ${filters.has(key) ? 'on' : 'off'}`}
                  style={{ '--c': m.color, '--l': m.light }}
                  onClick={() => toggleFilter(key)}
                >
                  <span className="chip-dot" />
                  {m.name}
                  {stDef && stDef.key !== 'none' && (
                    <span className="chip-status" title={stDef.label + (st?.detail ? ` – ${st.detail}` : '')}>
                      <StatusIcon statusDef={stDef} size={14} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Views ── */}
      {view === 'month' && (
        <MonthView
          calDays={calDays}
          eventsForDay={eventsForDay}
          today={today}
          statuses={statuses}
          animDir={animDir}
          onOpenDay={openDay}
          onOpenEvent={openEvent}
          onUpdateEvent={updateEvent}
          navPrev={navPrev}
          navNext={navNext}
        />
      )}
      {view === 'week' && (
        <WeekView
          events={events}
          filters={filters}
          curDate={curDate}
          today={today}
          onOpenDay={openDay}
          onOpenEvent={openEvent}
          onUpdateEvent={updateEvent}
        />
      )}
      {view === 'chores' && <ChoresView />}

      {/* ── Upcoming (calendar only) ── */}
      {view !== 'chores' && (
        <UpcomingEvents events={events} filters={filters} onOpenDay={openDay} />
      )}

      {/* FAB — calendar only */}
      {view !== 'chores' && (
        <button className="fab" onClick={openNewEvent}>+</button>
      )}

      {/* Event modal */}
      {showModal && (
        <DayModal
          dateStr={selectedDay}
          events={selectedDay ? events.filter(e => isEventOnDate(e, selectedDay)) : []}
          templates={templates}
          defaultMember={currentMemberKey}
          currentMemberKey={currentMemberKey}
          statusForDay={selectedDay ? statuses[currentMemberKey]?.[selectedDay] : null}
          onSetStatus={(key, detail) => saveStatusForDate(key, detail, selectedDay)}
          initialEditEvent={initialEditEvent}
          onAdd={addEvent}
          onDelete={deleteEvent}
          onUpdate={updateEvent}
          onAddTemplate={addTemplate}
          onDeleteTemplate={deleteTemplate}
          onClose={() => { setShowModal(false); setInitialEditEvent(null); }}
        />
      )}

      {/* Status picker */}
      {showStatusPicker && (
        <StatusPicker
          currentKey={myStatus?.status || 'none'}
          currentDetail={myStatus?.detail || ''}
          memberKey={currentMemberKey}
          onSave={saveStatus}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </div>
  );
}

// ── Status Picker ─────────────────────────────────────────────────────────────

function StatusPicker({ currentKey, currentDetail, memberKey, onSave, onClose }) {
  const [selected, setSelected] = useState(currentKey);
  const [detail,   setDetail]   = useState(currentDetail);
  const needsDetail = STATUSES.find(s => s.key === selected)?.detail;

  function handleSave() {
    onSave(selected, selected === 'none' ? '' : detail);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal status-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-hdr-left"><h2>Kde jsem?</h2></div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="status-picker-body">
          <div className="status-grid">
            {STATUSES.map(s => (
              <button
                key={s.key}
                className={`status-option ${selected === s.key ? 'sel' : ''}`}
                style={selected === s.key ? { '--c': MEMBERS[memberKey].color, '--l': MEMBERS[memberKey].light } : {}}
                onClick={() => setSelected(s.key)}
              >
                {(s.emoji || s.iconKey) && (
                  <span className="status-opt-emoji"><StatusIcon statusDef={s} size={24} /></span>
                )}
                <span className="status-opt-label">{s.label}</span>
              </button>
            ))}
          </div>

          {needsDetail && (
            <input
              className="form-input"
              type="text"
              placeholder="Kam jedeš? (volitelné)"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              autoFocus
            />
          )}

          <button
            className="btn-add"
            style={{ '--c': MEMBERS[memberKey].color }}
            onClick={handleSave}
          >
            Uložit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({ calDays, eventsForDay, today, statuses, animDir, onOpenDay, onOpenEvent, onUpdateEvent, navPrev, navNext }) {
  const [dragOverDs, setDragOverDs] = useState(null);
  const swipe      = useSwipe(navNext, navPrev);
  const touchRef   = useRef({ eventId: null, active: false, timer: null, el: null });
  const updateRef  = useRef(onUpdateEvent);
  const firstDay   = calDays.find(d => d.current);
  const animKey    = firstDay ? toDateStr(firstDay.date).slice(0, 7) : '';

  useEffect(() => { updateRef.current = onUpdateEvent; }, [onUpdateEvent]);

  // Document-level touch move/end for drag (requires long-press to activate)
  useEffect(() => {
    function onMove(e) {
      const t = touchRef.current;
      if (!t.el) return;
      const touch = e.touches[0];
      const dx = touch.clientX - t.startX;
      const dy = touch.clientY - t.startY;

      if (!t.eventId) {
        // Long-press not yet fired — cancel if user is swiping
        if (t.timer && Math.sqrt(dx * dx + dy * dy) > 10) {
          clearTimeout(t.timer);
          t.el.classList.remove('drag-pressing');
          touchRef.current = { eventId: null, active: false, timer: null, el: null };
        }
        return;
      }

      if (!t.active && Math.sqrt(dx * dx + dy * dy) > 8) {
        t.active = true;
        t.el.classList.remove('drag-pressing');
        const g = t.el.cloneNode(true);
        Object.assign(g.style, {
          position: 'fixed', left: t.rect.left + 'px', top: t.rect.top + 'px',
          width: t.rect.width + 'px', height: t.rect.height + 'px',
          opacity: '0.75', pointerEvents: 'none', zIndex: '9999', transition: 'none',
        });
        document.body.appendChild(g);
        t.ghost = g;
      }
      if (t.active) {
        e.preventDefault();
        t.ghost.style.transform = `translate(${dx}px,${dy}px)`;
        t.ghost.style.display = 'none';
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        t.ghost.style.display = '';
        setDragOverDs(el?.closest('[data-date]')?.dataset.date || null);
      }
    }
    function onEnd(e) {
      const t = touchRef.current;
      if (t.timer) { clearTimeout(t.timer); t.timer = null; }
      if (t.el) t.el.classList.remove('drag-pressing');
      if (t.eventId && t.active) {
        const touch = e.changedTouches[0];
        t.ghost.style.display = 'none';
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        t.ghost.style.display = '';
        const targetDs = el?.closest('[data-date]')?.dataset.date;
        if (targetDs) updateRef.current(t.eventId, { date: targetDs });
        document.body.removeChild(t.ghost);
      }
      touchRef.current = { eventId: null, active: false, timer: null, el: null };
      setDragOverDs(null);
    }
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      const t = touchRef.current;
      if (t.timer) clearTimeout(t.timer);
      if (t.el) t.el.classList.remove('drag-pressing');
      if (t.ghost) try { document.body.removeChild(t.ghost); } catch {}
    };
  }, []);

  return (
    <main className={`calendar-wrap anim-${animDir}`} key={animKey} {...swipe}>
      <div className="cal-grid">
        {DAYS_CZ.map(d => <div key={d} className="cal-head">{d}</div>)}

        {calDays.map(({ date, current }, i) => {
          const ds      = toDateStr(date);
          const dayEvts = eventsForDay(ds);
          const isToday = ds === today;

          return (
            <div
              key={i}
              data-date={ds}
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
              <div className="cell-top-row">
                <span className={`day-num ${isToday ? 'today-num' : ''}`}>{date.getDate()}</span>
                <div className="cell-statuses">
                  {Object.entries(MEMBERS).map(([k]) => {
                    const s = statuses[k]?.[ds];
                    if (!s || !s.status || s.status === 'none') return null;
                    const def = STATUSES.find(st => st.key === s.status);
                    if (!def) return null;
                    return (
                      <span key={k} className="cell-status-icon" title={`${MEMBERS[k].name}: ${def.label}`}>
                        <StatusIcon statusDef={def} size={13} />
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="cell-events">
                {dayEvts.slice(0, 3).map(e => {
                  const pos = multiDayPos(e, ds);
                  const draggable = !e.repeat || e.repeat === 'none';
                  return (
                    <div
                      key={e.id}
                      className={`cell-event ${pos ? `md-${pos}` : ''}`}
                      style={{ background: MEMBERS[e.member].color }}
                      draggable={draggable}
                      onDragStart={ev => { ev.dataTransfer.setData('eventId', e.id); ev.stopPropagation(); }}
                      onTouchStart={ev => {
                        ev.stopPropagation();
                        if (!draggable) return;
                        const rect = ev.currentTarget.getBoundingClientRect();
                        const el = ev.currentTarget;
                        const startX = ev.touches[0].clientX;
                        const startY = ev.touches[0].clientY;
                        clearTimeout(touchRef.current.timer);
                        if (touchRef.current.el) touchRef.current.el.classList.remove('drag-pressing');
                        el.classList.add('drag-pressing');
                        const timer = setTimeout(() => {
                          touchRef.current.eventId = e.id;
                          touchRef.current.timer = null;
                        }, 500);
                        touchRef.current = { eventId: null, el, rect, active: false, startX, startY, timer };
                      }}
                      onClick={ev => { ev.stopPropagation(); dayEvts.length > 1 ? onOpenDay(ds) : onOpenEvent(e); }}
                      title={`${MEMBERS[e.member].name}: ${e.time ? e.time + ' ' : ''}${e.title}`}
                    >
                      {pos !== 'mid' && <span className="ev-cat">{CATEGORIES[e.category || 'none']?.icon}</span>}
                      {!pos && <span className="ev-time-cell">{e.time}</span>}
                      <span className="ev-title-cell">{pos === 'mid' ? '' : e.title}</span>
                      {e.repeat && e.repeat !== 'none' && <span className="ev-repeat">🔁</span>}
                    </div>
                  );
                })}
                {dayEvts.length > 3 && <div className="ev-more">+{dayEvts.length - 3}</div>}
              </div>
              <div className="cell-dots">
                {dayEvts.slice(2, 7).map(e => (
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

const HOUR_H      = 56;
const START_HOUR  = 6;
const END_HOUR    = 22;
const WEEK_HOURS  = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

function timeToY(time) {
  const [h, m] = time.split(':').map(Number);
  return (h - START_HOUR) * HOUR_H + (m / 60) * HOUR_H;
}

function WeekView({ events, filters, curDate, today, onOpenDay, onOpenEvent, onUpdateEvent }) {
  const monday = getWeekStart(curDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return { date: d, ds: toDateStr(d) };
  });

  const [dragOverDs, setDragOverDs] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = HOUR_H;
  }, []);

  function dayEvents(ds) {
    return events.filter(e => isEventOnDate(e, ds) && filters.has(e.member));
  }

  return (
    <main className="week-view">
      <div className="wv-scroll" ref={scrollRef}>
      <div className="wv-headers">
        <div className="wv-gutter" />
        {weekDays.map(({ date, ds }) => (
          <div key={ds} className={`wv-col-head ${ds === today ? 'wv-today-head' : ''}`}>
            <span className="wv-dow">{DAYS_CZ[(date.getDay() + 6) % 7]}</span>
            <span className={`wv-date ${ds === today ? 'today-num' : ''}`}>{date.getDate()}</span>
          </div>
        ))}
      </div>

      <div className="wv-allday-row">
        <div className="wv-gutter"><span className="wv-allday-lbl">celý den</span></div>
        {weekDays.map(({ ds }) => (
          <div key={ds} className="wv-allday-col" onClick={() => onOpenDay(ds)}>
            {dayEvents(ds).filter(e => !e.time).map(e => (
              <div
                key={e.id}
                className="wv-allday-ev"
                style={{ background: MEMBERS[e.member].color }}
                onClick={ev => { ev.stopPropagation(); onOpenEvent(e); }}
              >
                {CATEGORIES[e.category || 'none']?.icon} {e.title}
                {e.repeat && e.repeat !== 'none' && ' 🔁'}
              </div>
            ))}
          </div>
        ))}
      </div>

        <div className="wv-grid" style={{ height: (END_HOUR - START_HOUR) * HOUR_H + 'px' }}>
          <div className="wv-gutter wv-time-axis">
            {WEEK_HOURS.map(h => (
              <div key={h} className="wv-time-label" style={{ top: (h - START_HOUR) * HOUR_H + 'px' }}>
                {h}:00
              </div>
            ))}
          </div>

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
              {WEEK_HOURS.map(h => (
                <div key={h} className="wv-hline" style={{ top: (h - START_HOUR) * HOUR_H + 'px' }} />
              ))}
              {ds === today && <CurrentTimeLine />}
              {dayEvents(ds).filter(e => e.time).map(e => (
                <div
                  key={e.id}
                  className="wv-event"
                  style={{ top: timeToY(e.time) + 'px', background: MEMBERS[e.member].color }}
                  draggable={!e.repeat || e.repeat === 'none'}
                  onDragStart={ev => { ev.dataTransfer.setData('eventId', e.id); ev.stopPropagation(); }}
                  onClick={ev => { ev.stopPropagation(); onOpenEvent(e); }}
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

  const nowTime = new Date().toTimeString().slice(0, 5);

  const upcoming = days.flatMap(ds =>
    events
      .filter(e => {
        if (!isEventOnDate(e, ds) || !filters.has(e.member)) return false;
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

function DayModal({ dateStr, events, templates, defaultMember, currentMemberKey, statusForDay, onSetStatus, initialEditEvent, onAdd, onDelete, onUpdate, onAddTemplate, onDeleteTemplate, onClose }) {
  const kbH = useKeyboardHeight();
  const [mode,     setMode]     = useState((initialEditEvent || !dateStr) ? 'step1' : 'list');
  const [editId,   setEditId]   = useState(initialEditEvent?.id ?? null);
  const [saving,   setSaving]   = useState(false);

  const [member,   setMember]   = useState(initialEditEvent?.member   ?? defaultMember);
  const [category, setCategory] = useState(initialEditEvent?.category ?? 'none');
  const [title,    setTitle]    = useState(initialEditEvent?.title    ?? '');
  const [date,     setDate]     = useState(initialEditEvent?.date     ?? dateStr ?? '');
  const [multiDay, setMultiDay] = useState(!!(initialEditEvent?.endDate));
  const [endDate,  setEndDate]  = useState(initialEditEvent?.endDate  ?? '');
  const [useTime,  setUseTime]  = useState(!!(initialEditEvent?.time));
  const [time,     setTime]     = useState(initialEditEvent?.time     ?? '13:00');
  const [duration, setDuration] = useState(initialEditEvent?.duration ?? 60);
  const [repeat,   setRepeat]   = useState(initialEditEvent?.repeat   ?? 'none');
  const [note,     setNote]     = useState(initialEditEvent?.note     ?? '');
  const [showNote, setShowNote] = useState(!!(initialEditEvent?.note));

  const sorted = [...events].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const displayDate = dateStr ? new Date(dateStr + 'T12:00:00') : null;
  const dateLabel = displayDate
    ? displayDate.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Nová událost';

  function resetForm() {
    setMember(defaultMember); setCategory('none'); setTitle('');
    setDate(dateStr ?? ''); setMultiDay(false); setEndDate('');
    setUseTime(false); setTime('13:00'); setDuration(60);
    setRepeat('none'); setNote(''); setShowNote(false); setEditId(null);
  }

  function openAdd() { resetForm(); setMode('step1'); }

  function startEdit(ev) {
    setEditId(ev.id); setMember(ev.member); setCategory(ev.category || 'none');
    setTitle(ev.title); setDate(ev.date);
    setMultiDay(!!(ev.endDate)); setEndDate(ev.endDate || '');
    setRepeat(ev.repeat || 'none');
    setNote(ev.note || ''); setShowNote(!!ev.note); setDuration(ev.duration ?? 60);
    if (ev.time) { setUseTime(true); setTime(ev.time); } else { setUseTime(false); }
    setMode('step1');
  }

  async function applyTemplate(t) {
    await onAdd({
      title: t.title, member: t.member, category: t.category || 'none',
      note: t.note || '', date: dateStr,
      time: t.time || null, repeat: t.repeat || 'none', endDate: null,
    });
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const data = {
      title: title.trim(), member, category, note, date,
      time: useTime ? time : null,
      duration: useTime ? duration : null,
      repeat,
      endDate: multiDay && endDate && endDate > date ? endDate : null,
    };
    if (editId) await onUpdate(editId, data);
    else        await onAdd(data);
    onClose();
  }

  async function handleSaveTemplate() {
    if (!title.trim()) return;
    await onAddTemplate({ title: title.trim(), member, category, note, time: useTime ? time : null, repeat });
  }

  const hdrTitle = mode === 'list' ? dateLabel
    : editId ? (title.trim() || 'Upravit událost') : 'Nová událost';

  const hdrLeft = mode !== 'list' && (
    <button className="back-btn" onClick={() => mode === 'step2' ? setMode('step1') : setMode('list')}>←</button>
  );

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-hdr">
          <div className="modal-hdr-left">
            {hdrLeft}
            <h2>{hdrTitle}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* LIST */}
        {mode === 'list' && (
          <div className="modal-list">
            {templates.length > 0 && (
              <div className="templates-section">
                <p className="section-label">Rychlé přidání</p>
                <div className="template-chips">
                  {templates.map(t => (
                    <div key={t.id} className="tmpl-wrap">
                      <button className="tmpl-chip" style={{ '--c': MEMBERS[t.member].color, '--l': MEMBERS[t.member].light }} onClick={() => applyTemplate(t)}>
                        {CATEGORIES[t.category || 'none']?.icon} {t.title}
                        {t.time && <span className="tmpl-time"> {t.time}</span>}
                      </button>
                      <button className="tmpl-del" onClick={() => onDeleteTemplate(t.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sorted.length > 0 && (
              <div className="event-list">
                {templates.length > 0 && <p className="section-label">Události</p>}
                {sorted.map(ev => (
                  <div key={ev.id} className="event-row" style={{ borderLeftColor: MEMBERS[ev.member].color }}>
                    <div className="event-info">
                      <span className="ev-cat-icon">{CATEGORIES[ev.category || 'none']?.icon}</span>
                      <span className="ev-member" style={{ color: MEMBERS[ev.member].color }}>{MEMBERS[ev.member].name}</span>
                      {ev.time && <span className="ev-badge">{ev.time}</span>}
                      {ev.endDate && ev.endDate > ev.date && <span className="ev-badge ev-multiday-badge">↔ více dní</span>}
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

            {dateStr && currentMemberKey && (
              <div className="day-status-section">
                <p className="section-label">
                  Kde jsem?
                  {statusForDay?.status && statusForDay.status !== 'none' && (
                    <button className="status-clear-btn" title="Zrušit status" onClick={() => onSetStatus('none')}>✕</button>
                  )}
                </p>
                <div className="status-quick-row">
                  {STATUSES.filter(s => s.key !== 'none').map(s => (
                    <button
                      key={s.key}
                      className={`status-quick-btn ${statusForDay?.status === s.key ? 'sel' : ''}`}
                      style={statusForDay?.status === s.key ? { '--c': MEMBERS[currentMemberKey].color, '--l': MEMBERS[currentMemberKey].light } : {}}
                      title={s.label}
                      onClick={() => onSetStatus(statusForDay?.status === s.key ? 'none' : s.key)}
                    >
                      <StatusIcon statusDef={s} size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="list-footer">
              <button className="btn-new-event" onClick={openAdd}>+ Přidat událost</button>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {mode === 'step1' && (
          <div className="wizard-step">
            <div className="wizard-body">
              <p className="step-label">Pro koho?</p>
              <div className="member-grid">
                {Object.entries(MEMBERS).map(([key, m]) => (
                  <button key={key} className={`mem-card ${member === key ? 'sel' : ''}`} style={{ '--c': m.color, '--l': m.light }} onClick={() => setMember(key)}>
                    <span className="mem-card-avatar">
                      {key === 'eliska'  ? <EliskaAvatar  size={44} /> :
                       key === 'pavel'   ? <PavelAvatar   size={44} /> :
                       key === 'filip'   ? <FilipAvatar   size={44} /> :
                                          <VsichniAvatar  size={44} />}
                    </span>
                    <span className="mem-card-name">{m.name}</span>
                  </button>
                ))}
              </div>

              <p className="step-label" style={{ marginTop: 20 }}>Kategorie</p>
              <div className="cat-grid">
                {Object.entries(CATEGORIES).map(([key, c]) => (
                  <button key={key} className={`cat-card ${category === key ? 'sel' : ''}`} onClick={() => setCategory(key)}>
                    <span className="cat-card-icon">{c.icon}</span>
                    <span className="cat-card-label">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="wizard-footer" style={{ paddingBottom: kbH > 0 ? kbH + 12 + 'px' : undefined }}>
              <div className="wizard-dots"><span className="dot active" /><span className="dot" /></div>
              <button className="btn-next" style={{ '--c': MEMBERS[member].color }} onClick={() => setMode('step2')}>Dále →</button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {mode === 'step2' && (
          <div className="wizard-step">
            <div className="wizard-body">
              <input className="form-input title-inp" type="text" placeholder="Název události…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />

              <div className="date-range-row">
                <input className="form-input date-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
                {multiDay && (
                  <>
                    <span className="date-range-sep">→</span>
                    <input className="form-input date-inp" type="date" value={endDate} min={date} onChange={e => setEndDate(e.target.value)} />
                  </>
                )}
              </div>

              <div className="time-row">
                <button className={`time-toggle ${multiDay ? 'on' : ''}`} onClick={() => { setMultiDay(v => !v); if (multiDay) setEndDate(''); }}>
                  <span className="time-toggle-knob" />
                </button>
                <span className="time-toggle-label" onClick={() => { setMultiDay(v => !v); if (multiDay) setEndDate(''); }}>Více dní</span>
              </div>

              {!multiDay && (
                <div className="time-row">
                  <button className={`time-toggle ${useTime ? 'on' : ''}`} onClick={() => setUseTime(v => !v)}>
                    <span className="time-toggle-knob" />
                  </button>
                  <span className="time-toggle-label" onClick={() => setUseTime(v => !v)}>Konkrétní čas</span>
                </div>
              )}
              {!multiDay && useTime && (
                <TimePicker value={time} onChange={setTime} />
              )}

              {!multiDay && useTime && (
                <div className="duration-row">
                  {[30, 60, 120, 240].map(m => (
                    <button key={m} className={`duration-btn ${duration === m ? 'sel' : ''}`} onClick={() => setDuration(m)}>
                      {m < 60 ? `${m} min` : `${m / 60} hod`}
                    </button>
                  ))}
                  <button className={`duration-btn ${duration === 0 ? 'sel' : ''}`} onClick={() => setDuration(0)}>Celý den</button>
                </div>
              )}

              <div className="repeat-row">
                {REPEAT_OPTIONS.map(o => (
                  <button key={o.value} className={`repeat-btn ${repeat === o.value ? 'sel' : ''}`} onClick={() => setRepeat(o.value)}>{o.label}</button>
                ))}
              </div>

              {!showNote ? (
                <button className="btn-add-note" onClick={() => setShowNote(true)}>+ Přidat poznámku</button>
              ) : (
                <textarea className="form-input note-inp" placeholder="Poznámka…" value={note} onChange={e => setNote(e.target.value)} rows={2} autoFocus />
              )}
            </div>

            <div className="wizard-footer" style={{ paddingBottom: kbH > 0 ? kbH + 12 + 'px' : undefined }}>
              <div className="wizard-dots"><span className="dot" /><span className="dot active" /></div>
              <div className="wizard-actions">
                {!editId && title.trim() && (
                  <button className="btn-tmpl" onClick={handleSaveTemplate}>☆</button>
                )}
                <button className="btn-add" style={{ '--c': MEMBERS[member].color }} onClick={handleSave} disabled={!title.trim() || saving}>
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
