'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [roll, setRoll] = useState('21CS0142');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [batch, setBatch] = useState('2027');
  const [cgpa, setCgpa] = useState('7.5');
  const [tenth, setTenth] = useState('75');
  const [twelfth, setTwelfth] = useState('75');
  const [passcode, setPasscode] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body =
        role === 'admin'
          ? { role: 'admin', passcode }
          : { role: 'student', roll, name, branch, batch, cgpa, tenth, twelfth };
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      router.push(data.redirect);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="mark">
            KGEC <span>TNP</span> Hub
          </div>
        </div>
        <div className="login-tabs">
          <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>
            Student
          </button>
          <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>
            TNP Office
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {role === 'student' ? (
          <form onSubmit={submit}>
            <div className="form-grid full">
              <div className="field">
                <label>Roll number</label>
                <input value={roll} onChange={(e) => setRoll(e.target.value)} required />
              </div>
              <div className="field">
                <label>Name (only used if this roll number is new)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Branch</label>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    {BRANCHES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Batch</label>
                  <input value={batch} onChange={(e) => setBatch(e.target.value)} />
                </div>
                <div className="field">
                  <label>CGPA</label>
                  <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.1" />
                </div>
                <div className="field">
                  <label>10th %</label>
                  <input value={tenth} onChange={(e) => setTenth(e.target.value)} type="number" />
                </div>
              </div>
            </div>
            <p className="page-sub" style={{ marginTop: 10, marginBottom: 16 }}>
              Existing roll number ({'"21CS0142"'} is the seeded demo student) signs straight in; a new one creates a
              profile from the fields above.
            </p>
            <button className="btn" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={submit}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>TNP Office passcode</label>
              <input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                type="password"
                required
                placeholder="Default: tnpadmin"
              />
            </div>
            <button className="btn" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
