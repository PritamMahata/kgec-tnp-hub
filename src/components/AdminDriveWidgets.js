'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PIPELINE_STAGES, statusLabel } from '@/lib/eligibility';

export function CorrectionForm({ jobId }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setText('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label>What changed about this drive?</label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Classification corrected: now On-Campus"'
        />
      </div>
      <button className="btn secondary small" style={{ marginTop: 10 }} disabled={busy || !text.trim()}>
        {busy ? 'Adding…' : 'Add correction'}
      </button>
    </form>
  );
}

export function DocumentUpload({ jobId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/jobs/${jobId}/documents`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <label className="btn secondary small" style={{ cursor: 'pointer' }}>
        {busy ? 'Uploading…' : '+ Upload document'}
        <input type="file" onChange={onChange} disabled={busy} style={{ display: 'none' }} />
      </label>
    </div>
  );
}

export function AddRoundForm({ jobId }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${jobId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, venue })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName('');
      setDate('');
      setVenue('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid" style={{ marginBottom: 0 }}>
        <div className="field">
          <label>Round name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Technical Round" />
        </div>
        <div className="field">
          <label>Date &amp; time (optional)</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field span2">
          <label>Venue (optional)</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </div>
      <button className="btn secondary small" style={{ marginTop: 10 }} disabled={busy || !name.trim()}>
        {busy ? 'Adding…' : '+ Add round'}
      </button>
    </form>
  );
}

export function ApplicantStatusSelect({ applicationId, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(newStatus) {
    setBusy(true);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select value={status} onChange={(e) => change(e.target.value)} disabled={busy}>
      {PIPELINE_STAGES.concat(['REJECTED']).map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}
