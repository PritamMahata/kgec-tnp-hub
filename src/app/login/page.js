'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil', 'MCA'];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Common Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student specific (only for signup)
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [course, setCourse] = useState('MCA');
  const [mobile, setMobile] = useState('');
  const [branch, setBranch] = useState('MCA');
  const [batch, setBatch] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [tenth, setTenth] = useState('');
  const [twelfth, setTwelfth] = useState('');
  
  // Admin specific (only for signup)
  const [passcode, setPasscode] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      let body = { action: mode, email, password };
      
      if (mode === 'signup') {
        if (role === 'admin') {
          body = { ...body, role: 'admin', passcode };
        } else {
          body = { ...body, role: 'student', roll, name, course, mobile, branch, batch, cgpa, tenth, twelfth };
        }
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      
      // If we get here, redirect!
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
        <div className="brand" style={{ marginBottom: 22,display:'flex', justifyContent: 'space-between'}}>
          <div className="mark">
            KGEC <span>TNP</span> Hub
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="small-slider" data-mode={mode}>
            <div className="slider-bg" />
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Log In
            </button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              Sign Up
            </button>
          </div>
        </div>
        </div>
        <div className="login-tabs">
          <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => { setRole('student'); setError(''); }}>
            Student
          </button>
          <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => { setRole('admin'); setError(''); }}>
            TNP Office
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-grid full">
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>

            {mode === 'signup' && role === 'student' && (
              <>
                <div className="field">
                  <label>Roll number</label>
                  <input placeholder='University Roll No' value={roll} onChange={(e) => setRoll(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="field">
                    <label>Course</label>
                    <select value={course} onChange={(e) => setCourse(e.target.value)}>
                      <option>MCA</option>
                      <option>BTECH</option>
                      <option>MTECH</option>
                    </select>
                  </div>
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
                    <input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder='2026'/>
                  </div>
                  <div className="field">
                    <label>Mobile Number</label>
                    <input 
                      value={mobile} 
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      type="tel" 
                      maxLength={10} 
                      placeholder="10 digits"
                    />
                  </div>
                  <div className="field">
                    <label>CGPA</label>
                    <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} type="number" step="0.1" />
                  </div>
                  <div className="field">
                    <label>10th %</label>
                    <input value={tenth} onChange={(e) => setTenth(e.target.value)} type="number" />
                  </div>
                  <div className="field">
                    <label>12th %</label>
                    <input value={twelfth} onChange={(e) => setTwelfth(e.target.value)} type="number" />
                  </div>
                </div>
              </>
            )}

            {mode === 'signup' && role === 'admin' && (
              <div className="field">
                <label>TNP Office passcode</label>
                <input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  type="password"
                  required
                  placeholder="Default: tnpadmin"
                />
              </div>
            )}
          </div>
          
          <p className="page-sub" style={{ marginTop: 10, marginBottom: 16 }}>
            {mode === 'signup' ? 'Create a new profile with Supabase Auth.' : 'Sign in to your existing account.'}
          </p>
          <button className="btn" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
