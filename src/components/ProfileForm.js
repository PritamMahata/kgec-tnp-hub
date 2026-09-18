'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];

export default function ProfileForm({ student }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: student.name,
    roll: student.roll,
    branch: student.branch,
    batch: student.batch,
    cgpa: student.cgpa,
    tenth: student.tenth,
    twelfth: student.twelfth,
    backlog: !!student.backlog
  });
  const [savedAt, setSavedAt] = useState(null);

  function set(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    save(next);
  }

  let saveTimer;
  function save(next) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      setSavedAt(Date.now());
      router.refresh();
    }, 400);
  }

  return (
    <div className="card">
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>Roll number</label>
          <input value={form.roll} disabled title="Roll number can't be changed here" />
        </div>
        <div className="field">
          <label>Branch</label>
          <select value={form.branch} onChange={(e) => set('branch', e.target.value)}>
            {BRANCHES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Batch</label>
          <input value={form.batch} onChange={(e) => set('batch', e.target.value)} />
        </div>
        <div className="field">
          <label>CGPA</label>
          <input type="number" step="0.1" value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} />
        </div>
        <div className="field">
          <label>10th %</label>
          <input type="number" value={form.tenth} onChange={(e) => set('tenth', e.target.value)} />
        </div>
        <div className="field">
          <label>12th %</label>
          <input type="number" value={form.twelfth} onChange={(e) => set('twelfth', e.target.value)} />
        </div>
        <div className="field">
          <label>Active backlog</label>
          <select value={form.backlog ? 'yes' : 'no'} onChange={(e) => set('backlog', e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <p className="page-sub" style={{ marginTop: 12, marginBottom: 0 }}>
        {savedAt ? 'Saved.' : 'Changes save automatically.'}
      </p>
    </div>
  );
}
