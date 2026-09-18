'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyButton({ jobId, label = 'Apply now' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Could not apply.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn small" onClick={apply} disabled={busy}>
      {busy ? 'Applying…' : label}
    </button>
  );
}
