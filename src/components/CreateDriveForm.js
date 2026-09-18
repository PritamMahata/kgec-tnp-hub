'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];

const EMPTY = {
  company: '',
  role: '',
  type: 'Placement',
  batch: '2027',
  branches: [],
  minCgpa: '7.0',
  min10: '70',
  min12: '70',
  backlogAllowed: false,
  package: '',
  location: '',
  deadline: '',
  rounds: [],
  requirements: []
};

function toLocalDatetimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateDriveForm() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiNotes, setAiNotes] = useState(null);

  const [form, setForm] = useState(EMPTY);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function toggleBranch(b) {
    setForm((f) => ({
      ...f,
      branches: f.branches.includes(b) ? f.branches.filter((x) => x !== b) : [...f.branches, b]
    }));
  }

  async function extract() {
    setAiError('');
    setAiNotes(null);
    setExtracting(true);
    try {
      const res = await fetch('/api/parse-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not extract fields.');
      const p = data.parsed;
      setForm({
        company: p.company || '',
        role: p.role || '',
        type: p.type === 'Internship' ? 'Internship' : 'Placement',
        batch: p.batch || '2027',
        branches: Array.isArray(p.branches) ? p.branches.filter((b) => BRANCHES.includes(b)) : [],
        minCgpa: String(p.minCgpa ?? 0),
        min10: String(p.min10 ?? 0),
        min12: String(p.min12 ?? 0),
        backlogAllowed: !!p.backlogAllowed,
        package: p.package || '',
        location: p.location || '',
        deadline: toLocalDatetimeInput(p.deadline),
        rounds: Array.isArray(p.rounds) ? p.rounds : [],
        requirements: Array.isArray(p.requirements) ? p.requirements : []
      });
      setAiNotes({ confidence: p.confidence, notes: p.notes });
    } catch (err) {
      setAiError(err.message);
    } finally {
      setExtracting(false);
    }
  }

  function addRound() {
    setForm((f) => ({ ...f, rounds: [...f.rounds, { name: '', date: '', venue: '' }] }));
  }
  function updateRound(i, field, value) {
    setForm((f) => {
      const rounds = f.rounds.slice();
      rounds[i] = { ...rounds[i], [field]: value };
      return { ...f, rounds };
    });
  }
  function removeRound(i) {
    setForm((f) => ({ ...f, rounds: f.rounds.filter((_, idx) => idx !== i) }));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitError('');
    if (form.branches.length === 0) {
      setSubmitError('Select at least one eligible branch.');
      return;
    }
    if (!form.deadline) {
      setSubmitError('Set a registration deadline.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          minCgpa: parseFloat(form.minCgpa) || 0,
          min10: parseFloat(form.min10) || 0,
          min12: parseFloat(form.min12) || 0,
          deadline: new Date(form.deadline).toISOString(),
          rounds: form.rounds
            .filter((r) => r.name.trim())
            .map((r) => ({ name: r.name, date: r.date ? new Date(r.date).toISOString() : null, venue: r.venue || null }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish drive.');
      router.push(`/admin/drives/${data.job.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="ai-box">
        <h3>Extract from a notice with AI</h3>
        <p>
          Paste the WhatsApp forward or notice text below. The model drafts the fields underneath — nothing is published
          until you review and click Publish.
        </p>
        <textarea
          rows={6}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Paste the recruitment notice text here…"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <button type="button" className="btn" onClick={extract} disabled={extracting || !rawText.trim()}>
          {extracting ? 'Extracting…' : 'Extract with AI'}
        </button>
        {aiError && <div className="error-banner" style={{ marginTop: 10 }}>{aiError}</div>}
        {aiNotes && (
          <div className="success-banner" style={{ marginTop: 10 }}>
            Extracted with <b>{aiNotes.confidence}</b> confidence — check the fields below before publishing.
            {aiNotes.notes ? ` ${aiNotes.notes}` : ''}
          </div>
        )}
      </div>

      <form onSubmit={submit}>
        {submitError && <div className="error-banner">{submitError}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Company</label>
            <input required value={form.company} onChange={(e) => update('company', e.target.value)} />
          </div>
          <div className="field">
            <label>Role</label>
            <input required value={form.role} onChange={(e) => update('role', e.target.value)} />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option>Placement</option>
              <option>Internship</option>
            </select>
          </div>
          <div className="field">
            <label>Batch</label>
            <input value={form.batch} onChange={(e) => update('batch', e.target.value)} />
          </div>
          <div className="field span2">
            <label>Eligible branches</label>
            <div className="checks">
              {BRANCHES.map((b) => (
                <label key={b}>
                  <input type="checkbox" checked={form.branches.includes(b)} onChange={() => toggleBranch(b)} /> {b}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Minimum CGPA</label>
            <input type="number" step="0.1" value={form.minCgpa} onChange={(e) => update('minCgpa', e.target.value)} />
          </div>
          <div className="field">
            <label>Minimum 10th %</label>
            <input type="number" value={form.min10} onChange={(e) => update('min10', e.target.value)} />
          </div>
          <div className="field">
            <label>Minimum 12th %</label>
            <input type="number" value={form.min12} onChange={(e) => update('min12', e.target.value)} />
          </div>
          <div className="field">
            <label>Backlog allowed?</label>
            <select value={form.backlogAllowed ? 'yes' : 'no'} onChange={(e) => update('backlogAllowed', e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label>Package</label>
            <input value={form.package} onChange={(e) => update('package', e.target.value)} placeholder="e.g. ₹6 LPA" />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="field span2">
            <label>Registration deadline</label>
            <input required type="datetime-local" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} />
          </div>
        </div>

        <div className="block" style={{ marginTop: 18 }}>
          <div className="block-head">
            <h2>Selection rounds</h2>
          </div>
          {form.rounds.map((r, i) => (
            <div className="card" key={i}>
              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Round name</label>
                  <input value={r.name} onChange={(e) => updateRound(i, 'name', e.target.value)} placeholder="e.g. Aptitude Test" />
                </div>
                <div className="field">
                  <label>Date &amp; time (optional)</label>
                  <input type="datetime-local" value={r.date} onChange={(e) => updateRound(i, 'date', e.target.value)} />
                </div>
                <div className="field span2">
                  <label>Venue (optional)</label>
                  <input value={r.venue} onChange={(e) => updateRound(i, 'venue', e.target.value)} />
                </div>
              </div>
              <button type="button" className="btn secondary small" style={{ marginTop: 10 }} onClick={() => removeRound(i)}>
                Remove round
              </button>
            </div>
          ))}
          <button type="button" className="btn secondary small" onClick={addRound}>
            + Add round
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish drive'}
          </button>
        </div>
      </form>
    </>
  );
}
