'use client';

import { useRouter } from 'next/navigation';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];

export default function OpportunityFilters({ branch, type, elig }) {
  const router = useRouter();

  function update(next) {
    const params = new URLSearchParams({ branch, type, elig, ...next });
    router.push(`/student/opportunities?${params.toString()}`);
  }

  return (
    <div className="filter-bar">
      <select value={branch} onChange={(e) => update({ branch: e.target.value })}>
        <option value="all">All branches</option>
        {BRANCHES.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <select value={type} onChange={(e) => update({ type: e.target.value })}>
        <option value="all">All types</option>
        <option value="Placement">Placement</option>
        <option value="Internship">Internship</option>
      </select>
      <select value={elig} onChange={(e) => update({ elig: e.target.value })}>
        <option value="all">All drives</option>
        <option value="eligible">Eligible for me</option>
      </select>
    </div>
  );
}
