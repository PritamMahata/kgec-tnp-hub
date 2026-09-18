import { getJobs, getJobById, getAllStudents } from '@/lib/db';
import { isEligible } from '@/lib/eligibility';
import JobPicker from '@/components/JobPicker';

export default async function StudentsPage(props) {
  const searchParams = await props.searchParams;
  const jobs = getJobs();
  const selectedId = searchParams.job || jobs[0]?.id;
  const job = getJobById(selectedId);
  const students = getAllStudents().filter((s) => !s.isDemo);

  const results = students.map((s) => ({ s, eligible: job ? isEligible(job, s) : false }));
  const eligibleCount = results.filter((r) => r.eligible).length;
  const byBranch = {};
  results.filter((r) => r.eligible).forEach((r) => (byBranch[r.s.branch] = (byBranch[r.s.branch] || 0) + 1));

  return (
    <>
      <h1 className="page-title">Students</h1>
      <p className="page-sub">The seeded roster, checked live against a drive's eligibility rule.</p>

      <JobPicker jobs={jobs} selectedId={selectedId} />

      <div className="stat-row">
        <div className="stat-tile">
          <div className="n">{eligibleCount}</div>
          <div className="l">Eligible of {students.length}</div>
        </div>
        {Object.entries(byBranch).map(([b, n]) => (
          <div className="stat-tile" key={b}>
            <div className="n">{n}</div>
            <div className="l">{b}</div>
          </div>
        ))}
      </div>

      <table className="data">
        <thead>
          <tr>
            <th>Roll</th>
            <th>Branch</th>
            <th>CGPA</th>
            <th>10th</th>
            <th>12th</th>
            <th>Backlog</th>
            <th>Eligible</th>
          </tr>
        </thead>
        <tbody>
          {results.slice(0, 25).map((r) => (
            <tr key={r.s.id}>
              <td className="mono">{r.s.roll}</td>
              <td>{r.s.branch}</td>
              <td>{r.s.cgpa}</td>
              <td>{r.s.tenth}%</td>
              <td>{r.s.twelfth}%</td>
              <td>{r.s.backlog ? 'Yes' : 'No'}</td>
              <td>
                <span className={`tagline ${r.eligible ? 'success' : 'muted'}`}>{r.eligible ? 'Eligible' : 'No'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="page-sub" style={{ marginTop: 10 }}>
        Showing 25 of {students.length} students.
      </p>
    </>
  );
}
