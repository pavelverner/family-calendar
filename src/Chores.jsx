import { useState, useEffect, useMemo, useRef } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'domaci-prace-v5';

const EMOJIS = [
  '🧹','🫧','🚿','🛁','🪣','🧺','🧻','🍽️','♻️','🗑️',
  '🪴','🐾','🛒','🔧','🪟','🛏️','🧴','🌿','💡','🔑',
  '📦','🧊','🍳','🪒','🧽','🚗','🌾','👕','🪜','🧸',
];

const COLORS_HORNI = [
  { text:'#553c9a', bg:'#e9d8fd' },
  { text:'#6b46c1', bg:'#faf5ff' },
  { text:'#744210', bg:'#fefcbf' },
  { text:'#97266d', bg:'#fed7e2' },
  { text:'#2c7a7b', bg:'#e6fffa' },
  { text:'#7b341e', bg:'#feebc8' },
  { text:'#276749', bg:'#c6f6d5' },
];
const COLORS_DOLNI = [
  { text:'#2b6cb0', bg:'#bee3f8' },
  { text:'#2c5282', bg:'#ebf8ff' },
  { text:'#c05621', bg:'#feebc8' },
  { text:'#276749', bg:'#c6f6d5' },
  { text:'#744210', bg:'#fefcbf' },
  { text:'#3c366b', bg:'#e9d8fd' },
];

const DEFAULTS = [
  { id:'koupelna', name:'Umýt koupelnu',   freq:7,  emoji:'🚿', floor:'horni' },
  { id:'prach',    name:'Utřít prach',      freq:14, emoji:'🧹', floor:'horni' },
  { id:'schody',   name:'Vyluxovat schody', freq:14, emoji:'🪜', floor:'horni' },
  { id:'vyprat',   name:'Vyprat',           freq:7,  emoji:'🧺', floor:'horni' },
  { id:'pradlo',   name:'Složit prádlo',    freq:7,  emoji:'👕', floor:'horni' },
  { id:'postele',  name:'Převléct postele', freq:14, emoji:'🛏️', floor:'horni' },
  { id:'kvetiny',  name:'Zalít květiny',    freq:7,  emoji:'🪴', floor:'horni' },
  { id:'mycka',    name:'Myčka',            freq:3,  emoji:'🍽️', floor:'dolni' },
  { id:'kos',      name:'Vynést koš',       freq:7,  emoji:'🗑️', floor:'dolni' },
  { id:'lux',      name:'Pustit lux',       freq:7,  emoji:'🫧', floor:'dolni' },
  { id:'podlaha',  name:'Vytřít podlahu',   freq:14, emoji:'🧽', floor:'dolni' },
  { id:'trava',    name:'Posekat trávu',    freq:14, emoji:'🌾', floor:'dolni' },
  { id:'auto',     name:'Umýt auto',        freq:30, emoji:'🚗', floor:'dolni' },
];

const MESICE_CZ = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayDate() { const d = new Date(); d.setHours(0,0,0,0); return d; }

function lastDone(history, id) {
  const h = history[id];
  if (!h || !h.length) return null;
  return new Date(h[0]);
}

function daysUntilDue(history, chore) {
  const last = lastDone(history, chore.id);
  const t = todayDate();
  if (!last) return 0;
  const next = new Date(last);
  next.setDate(next.getDate() + chore.freq);
  next.setHours(0,0,0,0);
  return Math.round((next - t) / 86400000);
}

function urgency(history, chore) {
  const d = daysUntilDue(history, chore);
  if (d < 0)   return 'overdue';
  if (d === 0) return 'today';
  if (d <= 1)  return 'soon';
  return 'ok';
}

function urgencyOrder(history, chore) {
  const d = daysUntilDue(history, chore);
  const u = urgency(history, chore);
  if (u === 'overdue') return -1000 + d;
  if (u === 'today')   return 0;
  if (u === 'soon')    return 1;
  return 100 + d;
}

function colorFor(chores, chore) {
  const floorChores = chores.filter(c => c.floor === chore.floor);
  const idx = floorChores.indexOf(chore);
  const pal = chore.floor === 'horni' ? COLORS_HORNI : COLORS_DOLNI;
  return pal[idx % pal.length];
}

function fmtDt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('cs-CZ', {
    day:'numeric', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  });
}

function dnyText(n) {
  const a = Math.abs(n);
  return a === 1 ? 'den' : (a < 5 ? 'dny' : 'dní');
}

// ── State hook ────────────────────────────────────────────────────────────────

function useChoresState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
      chores: DEFAULTS.map(c => ({...c})),
      history: Object.fromEntries(DEFAULTS.map(c => [c.id, []])),
    };
  });

  function persist(newState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
  }

  function complete(id) {
    const updated = [new Date().toISOString(), ...(state.history[id] || [])].slice(0, 200);
    persist({ ...state, history: { ...state.history, [id]: updated } });
  }

  function addChore(data) {
    const id = 'c_' + Date.now();
    persist({
      ...state,
      chores: [...state.chores, { ...data, id }],
      history: { ...state.history, [id]: [] },
    });
  }

  function updateChore(id, data) {
    persist({ ...state, chores: state.chores.map(c => c.id === id ? { ...c, ...data } : c) });
  }

  function deleteChore(id) {
    const { [id]: _removed, ...history } = state.history;
    persist({ ...state, chores: state.chores.filter(c => c.id !== id), history });
  }

  return { state, complete, addChore, updateChore, deleteChore };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChoresView() {
  const { state, complete, addChore, updateChore, deleteChore } = useChoresState();
  const [tab,         setTab]         = useState('dashboard');
  const [toast,       setToast]       = useState('');
  const [editModal,   setEditModal]   = useState(null); // null | 'add' | choreId
  const [deleteModal, setDeleteModal] = useState(null); // null | choreId
  const [calYear,     setCalYear]     = useState(() => new Date().getFullYear());
  const [calMonth,    setCalMonth]    = useState(() => new Date().getMonth());
  const [calFilter,   setCalFilter]   = useState('all');
  const [collapsed,   setCollapsed]   = useState({ horni: false, dolni: false });

  const toastTimer = useRef(null);
  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function handleComplete(id) {
    complete(id);
    const c = state.chores.find(x => x.id === id);
    showToast(`✓ ${c?.name || 'Činnost'} splněna!`);
  }

  function handleSaveChore(data) {
    if (editModal === 'add') { addChore(data); showToast('Činnost přidána'); }
    else { updateChore(editModal, data); showToast('Činnost uložena'); }
    setEditModal(null);
  }

  function handleDeleteConfirm() {
    deleteChore(deleteModal);
    showToast('Činnost smazána');
    setDeleteModal(null);
  }

  return (
    <div className="chores-wrap">

      {/* Inner tab bar */}
      <div className="chores-tabs">
        <button className={`chores-tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
        <button className={`chores-tab ${tab === 'calendar'  ? 'active' : ''}`} onClick={() => setTab('calendar')}>Kalendář</button>
        <button className={`chores-tab ${tab === 'manage'    ? 'active' : ''}`} onClick={() => setTab('manage')}>Správa</button>
        <button className="chores-tab-add" onClick={() => setEditModal('add')}>＋ Přidat</button>
      </div>

      <div className="chores-body">
        {tab === 'dashboard' && (
          <ChoresDashboard
            state={state}
            onComplete={handleComplete}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        )}
        {tab === 'calendar' && (
          <ChoresCalendar
            state={state}
            calYear={calYear} setCalYear={setCalYear}
            calMonth={calMonth} setCalMonth={setCalMonth}
            calFilter={calFilter} setCalFilter={setCalFilter}
          />
        )}
        {tab === 'manage' && (
          <ChoresManage
            state={state}
            onEdit={id => setEditModal(id)}
            onDelete={id => setDeleteModal(id)}
            onAdd={() => setEditModal('add')}
          />
        )}
      </div>

      {/* Edit/Add modal */}
      {editModal !== null && (
        <ChoreModal
          chore={editModal !== 'add' ? state.chores.find(c => c.id === editModal) : null}
          onSave={handleSaveChore}
          onCancel={() => setEditModal(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteModal !== null && (
        <div className="chores-overlay" onClick={() => setDeleteModal(null)}>
          <div className="chores-modal" onClick={e => e.stopPropagation()}>
            <h3 className="chores-modal-title">Opravdu smazat?</h3>
            <p className="chores-modal-sub">Tato akce smaže činnost i celou historii jejího plnění.</p>
            <div className="chores-modal-actions">
              <button className="chores-btn chores-btn-neutral" onClick={() => setDeleteModal(null)}>Zrušit</button>
              <button className="chores-btn chores-btn-danger" onClick={handleDeleteConfirm}>Smazat</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="chores-toast">{toast}</div>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function ChoresDashboard({ state, onComplete, collapsed, setCollapsed }) {
  const { chores, history } = state;

  const totals = useMemo(() => {
    let over = 0, soon = 0, ok = 0;
    chores.forEach(c => {
      const u = urgency(history, c);
      if (u === 'overdue') over++;
      else if (u === 'today' || u === 'soon') soon++;
      else ok++;
    });
    return { over, soon, ok };
  }, [chores, history]);

  function toggleFloor(floor) {
    setCollapsed(prev => ({ ...prev, [floor]: !prev[floor] }));
  }

  return (
    <div>
      {/* Summary */}
      <div className="chores-summary">
        <div className="chores-sum-card s-red">
          <div className="chores-sum-num">{totals.over}</div>
          <div className="chores-sum-lbl">Po termínu</div>
        </div>
        <div className="chores-sum-card s-yellow">
          <div className="chores-sum-num">{totals.soon}</div>
          <div className="chores-sum-lbl">Dnes / Zítra</div>
        </div>
        <div className="chores-sum-card s-green">
          <div className="chores-sum-num">{totals.ok}</div>
          <div className="chores-sum-lbl">V pořádku</div>
        </div>
      </div>

      {/* Floors */}
      {['horni', 'dolni'].map(floor => {
        const floorChores = chores
          .filter(c => c.floor === floor)
          .sort((a, b) => urgencyOrder(history, a) - urgencyOrder(history, b));

        let fo = 0, fs = 0, fk = 0;
        floorChores.forEach(c => {
          const u = urgency(history, c);
          if (u === 'overdue') fo++;
          else if (u === 'today' || u === 'soon') fs++;
          else fk++;
        });

        return (
          <div key={floor} className="chores-floor-section">
            <div className={`chores-floor-hdr ${floor}`} onClick={() => toggleFloor(floor)}>
              <span className="chores-floor-icon">{floor === 'horni' ? '🔼' : '🔽'}</span>
              <span className="chores-floor-name">{floor === 'horni' ? 'Horní podlaží' : 'Dolní podlaží'}</span>
              <div className="chores-floor-stats">
                {fo > 0 && <span className="chores-fstat red">{fo} po termínu</span>}
                {fs > 0 && <span className="chores-fstat yellow">{fs} dnes/zítra</span>}
                {fk > 0 && <span className="chores-fstat green">{fk} OK</span>}
              </div>
              <span className="chores-floor-arrow">{collapsed[floor] ? '▼' : '▲'}</span>
            </div>

            {!collapsed[floor] && (
              <div className="chores-floor-body">
                {floorChores.length === 0 && (
                  <p className="chores-empty-floor">Žádné činnosti v tomto podlaží.</p>
                )}
                {floorChores.map(c => (
                  <ChoreCard key={c.id} chore={c} history={history} chores={chores} onComplete={onComplete} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChoreCard({ chore, history, chores, onComplete }) {
  const u    = urgency(history, chore);
  const d    = daysUntilDue(history, chore);
  const last = lastDone(history, chore.id);

  let badgeTxt, badgeCls;
  if (u === 'overdue')     { badgeTxt = `${Math.abs(d)} ${dnyText(d)} po termínu`; badgeCls = 'badge-overdue'; }
  else if (u === 'today')  { badgeTxt = 'Dnes!';                                    badgeCls = 'badge-today'; }
  else if (u === 'soon')   { badgeTxt = 'Zítra';                                    badgeCls = 'badge-soon'; }
  else                     { badgeTxt = `Za ${d} ${dnyText(d)}`;                    badgeCls = 'badge-ok'; }

  return (
    <div className={`chores-card u-${u}`}>
      <div className="chores-card-icon">{chore.emoji || '🏠'}</div>
      <div className="chores-card-body">
        <div className="chores-card-name">{chore.name}</div>
        <div className="chores-card-meta">
          <span>Každých {chore.freq} dní</span>
          <span>{last ? `Naposledy: ${fmtDt(last.toISOString())}` : 'Ještě nesplněno'}</span>
        </div>
      </div>
      <span className={`chores-badge ${badgeCls}`}>{badgeTxt}</span>
      <button className="chores-done-btn" onClick={() => onComplete(chore.id)}>✓ Splnit</button>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function ChoresCalendar({ state, calYear, setCalYear, calMonth, setCalMonth, calFilter, setCalFilter }) {
  const { chores, history } = state;
  const today = todayDate();

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function completedInMonth(chore) {
    const res = new Set();
    (history[chore.id] || []).forEach(iso => {
      const d = new Date(iso);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) res.add(d.getDate());
    });
    return res;
  }

  function plannedInMonth(chore) {
    const last = lastDone(history, chore.id);
    const res = new Set();
    const daysInM = new Date(calYear, calMonth + 1, 0).getDate();
    if (!last) {
      // Never done: show today and every freq days after
      const base = todayDate();
      for (let day = 1; day <= daysInM; day++) {
        const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
        const diff = Math.round((d - base) / 86400000);
        if (diff >= 0 && diff % chore.freq === 0) res.add(day);
      }
      return res;
    }
    for (let day = 1; day <= daysInM; day++) {
      const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
      const diff = Math.round((d - last) / 86400000);
      if (diff > 0 && diff % chore.freq === 0) res.add(day);
    }
    return res;
  }

  const filtered = chores.filter(c => calFilter === 'all' || c.floor === calFilter);
  const data = filtered.map(c => ({
    chore: c,
    col: colorFor(chores, c),
    done: completedInMonth(c),
    plan: plannedInMonth(c),
  }));

  const firstDow   = new Date(calYear, calMonth, 1).getDay();
  const offset     = firstDow === 0 ? 6 : firstDow - 1;
  const daysInM    = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const total      = Math.ceil((offset + daysInM) / 7) * 7;

  const cells = [];
  for (let i = 0; i < total; i++) {
    let day, other = false;
    if (i < offset)                { day = daysInPrev - offset + i + 1; other = true; }
    else if (i >= offset + daysInM){ day = i - offset - daysInM + 1;    other = true; }
    else                           { day = i - offset + 1; }

    const cellDate = new Date(
      calYear,
      other && i < offset ? calMonth - 1 : other ? calMonth + 1 : calMonth,
      day
    );
    cellDate.setHours(0,0,0,0);
    const isToday = cellDate.getTime() === today.getTime();

    const pills = [];
    if (!other) {
      data.forEach(({ chore, col, done, plan }) => {
        let status = null;
        if (done.has(day)) status = 'done';
        else if (plan.has(day)) {
          if (cellDate < today) status = 'overdue';
          else if (isToday)     status = 'today';
          else                  status = 'planned';
        }
        if (!status) return;
        pills.push(
          <div
            key={chore.id}
            className={`chores-cal-pill ${status === 'done' ? 'pill-done' : status === 'overdue' ? 'pill-overdue' : status === 'today' ? 'pill-today' : ''}`}
            style={{ color: col.text, background: col.bg }}
          >
            <span>{status === 'done' ? '✓' : status === 'overdue' ? '!' : '·'}</span>
            <span>{chore.name}</span>
          </div>
        );
      });
    }

    cells.push({ day, other, isToday, pills });
  }

  return (
    <div>
      {/* Floor filter */}
      <div className="chores-cal-filter">
        {[['all','Vše'], ['horni','🔼 Horní'], ['dolni','🔽 Dolní']].map(([val, lbl]) => (
          <button
            key={val}
            className={`chores-filter-btn ${val} ${calFilter === val ? 'active' : ''}`}
            onClick={() => setCalFilter(val)}
          >{lbl}</button>
        ))}
      </div>

      {/* Nav */}
      <div className="chores-cal-nav">
        <button className="chores-nav-btn" onClick={prevMonth}>←</button>
        <span className="chores-cal-title">{MESICE_CZ[calMonth]} {calYear}</span>
        <button className="chores-nav-btn" onClick={nextMonth}>→</button>
      </div>

      {/* Grid */}
      <div className="chores-cal-wrap">
        <div className="chores-cal-head">
          {['Po','Út','St','Čt','Pá','So','Ne'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="chores-cal-body">
          {cells.map((cell, i) => (
            <div key={i} className={`chores-cal-cell ${cell.other ? 'other' : ''} ${cell.isToday ? 'today-cell' : ''}`}>
              <div className="chores-day-num">{cell.day}</div>
              <div className="chores-cal-pills">{cell.pills}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="chores-cal-legend">
        {[
          { bg:'#c6f6d5', border:'#276749', label:'Splněno' },
          { bg:'#feebc8', border:'#c05621', label:'Dnes' },
          { bg:'#fed7d7', border:'#c53030', label:'Po termínu', dashed:true },
          { bg:'#e9d8fd', border:'#805ad5', label:'Horní — plán' },
          { bg:'#bee3f8', border:'#3182ce', label:'Dolní — plán' },
        ].map(({ bg, border, label, dashed }) => (
          <div key={label} className="chores-legend-item">
            <div className="chores-legend-dot" style={{ background: bg, border: `1.5px ${dashed ? 'dashed' : 'solid'} ${border}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Manage ────────────────────────────────────────────────────────────────────

function ChoresManage({ state, onEdit, onDelete, onAdd }) {
  const { chores, history } = state;

  return (
    <div>
      {['horni', 'dolni'].map(floor => {
        const floorChores = chores.filter(c => c.floor === floor);
        return (
          <div key={floor}>
            <div className={`chores-manage-hdr ${floor}`}>
              {floor === 'horni' ? '🔼 Horní podlaží' : '🔽 Dolní podlaží'}
            </div>
            {floorChores.length === 0 && <p className="chores-empty-floor">Žádné činnosti.</p>}
            {floorChores.map(c => (
              <div key={c.id} className="chores-manage-row">
                <div className="chores-manage-icon">{c.emoji || '🏠'}</div>
                <div className="chores-manage-body">
                  <div className="chores-manage-name">{c.name}</div>
                  <div className="chores-manage-freq">
                    Každých {c.freq} dní · splněno {(history[c.id] || []).length}×
                  </div>
                </div>
                <div className="chores-manage-actions">
                  <button className="chores-btn chores-btn-edit" onClick={() => onEdit(c.id)}>Upravit</button>
                  <button className="chores-btn chores-btn-danger" onClick={() => onDelete(c.id)}>Smazat</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <div style={{ marginTop: 16 }}>
        <button className="chores-btn chores-btn-primary" onClick={onAdd}>＋ Přidat novou činnost</button>
      </div>
    </div>
  );
}

// ── Chore Modal (add / edit) ───────────────────────────────────────────────────

function ChoreModal({ chore, onSave, onCancel }) {
  const [name,      setName]      = useState(chore?.name  || '');
  const [floor,     setFloor]     = useState(chore?.floor || 'horni');
  const [emoji,     setEmoji]     = useState(chore?.emoji || '🧹');
  const [freqVal,   setFreqVal]   = useState(() => {
    if (!chore) return '7';
    const known = ['1','2','3','5','7','14','30'];
    return known.includes(String(chore.freq)) ? String(chore.freq) : 'custom';
  });
  const [freqCustom, setFreqCustom] = useState(chore?.freq || 7);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { nameRef.current?.focus(); return; }
    const freq = freqVal === 'custom' ? (parseInt(freqCustom) || 7) : parseInt(freqVal);
    onSave({ name: trimmed, floor, emoji, freq });
  }

  return (
    <div className="chores-overlay" onClick={onCancel}>
      <div className="chores-modal" onClick={e => e.stopPropagation()}>
        <h3 className="chores-modal-title">{chore ? 'Upravit činnost' : 'Přidat činnost'}</h3>

        <div className="chores-form-group">
          <label className="chores-label">Název činnosti</label>
          <input
            ref={nameRef}
            className="chores-input"
            type="text"
            placeholder="např. Myčka"
            maxLength={40}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="chores-form-group">
          <label className="chores-label">Podlaží</label>
          <div className="chores-floor-toggle">
            <div className={`chores-floor-choice horni ${floor === 'horni' ? 'sel' : ''}`} onClick={() => setFloor('horni')}>🔼 Horní</div>
            <div className={`chores-floor-choice dolni ${floor === 'dolni' ? 'sel' : ''}`} onClick={() => setFloor('dolni')}>🔽 Dolní</div>
          </div>
        </div>

        <div className="chores-form-group">
          <label className="chores-label">Ikona</label>
          <div className="chores-emoji-grid">
            {EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                className={`chores-emoji-btn ${em === emoji ? 'sel' : ''}`}
                onClick={() => setEmoji(em)}
              >{em}</button>
            ))}
          </div>
        </div>

        <div className="chores-form-group">
          <label className="chores-label">Frekvence</label>
          <select className="chores-select" value={freqVal} onChange={e => setFreqVal(e.target.value)}>
            <option value="1">Každý den</option>
            <option value="2">Každé 2 dny</option>
            <option value="3">Každé 3 dny</option>
            <option value="5">Každých 5 dní</option>
            <option value="7">Každý týden (7 dní)</option>
            <option value="14">Každé 2 týdny</option>
            <option value="30">Jednou měsíčně</option>
            <option value="custom">Vlastní počet dní…</option>
          </select>
        </div>

        {freqVal === 'custom' && (
          <div className="chores-form-group">
            <label className="chores-label">Počet dní</label>
            <input
              className="chores-input"
              type="number"
              min={1} max={365}
              value={freqCustom}
              onChange={e => setFreqCustom(e.target.value)}
            />
          </div>
        )}

        <div className="chores-modal-actions">
          <button className="chores-btn chores-btn-neutral" onClick={onCancel}>Zrušit</button>
          <button className="chores-btn chores-btn-primary" onClick={handleSave}>Uložit</button>
        </div>
      </div>
    </div>
  );
}
