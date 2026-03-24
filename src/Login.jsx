import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { MEMBERS, USER_EMAILS } from './constants';

const LOGIN_USERS = ['pavel', 'eliska'];

export default function Login() {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!selected || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, USER_EMAILS[selected], password);
    } catch {
      setError('Špatné heslo. Zkus to znovu.');
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">📅</div>
        <h1 className="login-title">Rodinný Kalendář</h1>
        <p className="login-sub">Kdo jsi?</p>

        <div className="login-persons">
          {LOGIN_USERS.map(key => {
            const m = MEMBERS[key];
            return (
              <button
                key={key}
                className={`person-btn ${selected === key ? 'sel' : ''}`}
                style={{ '--c': m.color, '--l': m.light }}
                onClick={() => { setSelected(key); setPassword(''); setError(''); }}
              >
                <span className="person-avatar">{m.name[0]}</span>
                {m.name}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="login-form">
            <input
              className="form-input"
              type="password"
              placeholder="Heslo…"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button
              className="btn-login"
              style={{ '--c': MEMBERS[selected].color }}
              onClick={handleLogin}
              disabled={!password || loading}
            >
              {loading ? 'Přihlašuji…' : `Vstoupit jako ${MEMBERS[selected].name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
