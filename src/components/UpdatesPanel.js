'use client';

import { useEffect, useState } from 'react';
import { fmtDate } from '@/lib/format';

const KEY = 'tnp-seen-updates';

function loadSeen() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
function saveSeen(seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    /* storage unavailable — updates will just keep showing, which is safe */
  }
}

export default function UpdatesPanel({ jobs }) {
  const [seen, setSeen] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSeen(loadSeen());
    setReady(true);
  }, []);

  if (!ready) return null;

  const updated = jobs.filter((j) => j.changelogs.length && seen[j.id] !== j.version);
  if (!updated.length) return null;

  function markSeen(job) {
    const next = { ...seen, [job.id]: job.version };
    setSeen(next);
    saveSeen(next);
  }

  return (
    <div className="block">
      <div className="block-head">
        <span className="dot info"></span>
        <h2>Updated information</h2>
        <span className="count">{updated.length}</span>
      </div>
      {updated.map((j) => {
        const last = j.changelogs[j.changelogs.length - 1];
        return (
          <div className="card" key={j.id}>
            <div className="card-row">
              <div>
                <div className="co">{j.company}</div>
                <div className="meta">
                  {last.text} — {fmtDate(last.date)}
                </div>
              </div>
              <button className="btn secondary small" onClick={() => markSeen(j)}>
                Mark as seen
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
