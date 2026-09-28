'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil', 'MCA'];

export default function ProfileForm({ student }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: student.name,
    roll: student.roll,
    course: student.course || 'MCA',
    mobile: student.mobile || '',
    branch: student.branch || 'MCA',
    batch: student.batch,
    cgpa: student.cgpa,
    tenth: student.tenth,
    twelfth: student.twelfth,
    backlog: !!student.backlog
  });
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function uploadCv(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/profile/cv', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

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
          <label>Course</label>
          <select value={form.course} onChange={(e) => set('course', e.target.value)}>
            <option>MCA</option>
            <option>BTECH</option>
            <option>MTECH</option>
          </select>
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
          <label>Mobile Number</label>
          <input 
            value={form.mobile} 
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              const next = { ...form, mobile: val };
              setForm(next);
              if (val.length === 10 || val.length === 0) {
                save(next);
              }
            }} 
            type="tel" 
            maxLength={10} 
            placeholder="10 digits"
          />
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
      <div className="divider" />
      <div className="field">
        <label>Resume / CV (PDF only)</label>
        {student.cvFilename && (
          <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
            Current file: <a href={student.cvUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--ink)' }}>{student.cvFilename}</a>
          </div>
        )}
        <input type="file" accept=".pdf" onChange={uploadCv} disabled={uploading} />
        {uploading && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Uploading…</div>}
        {uploadError && <div style={{ fontSize: 12, color: 'var(--urgent)', marginTop: 4 }}>{uploadError}</div>}
      </div>
      
      <p className="page-sub" style={{ marginTop: 16, marginBottom: 0 }}>
        {savedAt ? 'Saved.' : 'Changes save automatically.'}
      </p>
    </div>
  );
}
