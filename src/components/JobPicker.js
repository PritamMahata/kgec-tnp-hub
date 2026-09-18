'use client';

import { useRouter } from 'next/navigation';

export default function JobPicker({ jobs, selectedId }) {
  const router = useRouter();
  return (
    <div className="filter-bar">
      <select value={selectedId} onChange={(e) => router.push(`/admin/students?job=${e.target.value}`)}>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.company}
          </option>
        ))}
      </select>
    </div>
  );
}
