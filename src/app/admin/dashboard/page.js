import Link from 'next/link';
import { getJobs, getApplicationStatsForJob, getEligibleCountForJob } from '@/lib/db';
import { urgencyOf } from '@/lib/eligibility';
import { fmtDateTime } from '@/lib/format';

export default function AdminDashboard() {
  const jobs = getJobs();
  const active = jobs.filter((j) => urgencyOf(j.deadline) !== 'expired').length;

  const stats = jobs.map((j) => ({ job: j, ...getApplicationStatsForJob(j.id), eligible: getEligibleCountForJob(j).total }));
  const totalApps = stats.reduce((s, x) => s + x.registered, 0);
  const totalShortlist = stats.reduce((s, x) => s + x.shortlisted, 0);
  const totalSelected = stats.reduce((s, x) => s + x.selected, 0);

  const closingSoon = jobs.filter((j) => urgencyOf(j.deadline) === 'urgent');
  const updatedRecently = jobs.filter((j) => j.changelogs.length);

  return (
    <>
      <h1 className="page-title">TNP Office</h1>
      <p className="page-sub">Every drive as a structured record — not a message thread.</p>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="n">{active}</div>
          <div className="l">Active drives</div>
        </div>
        <div className="stat-tile">
          <div className="n">{totalApps}</div>
          <div className="l">Applications</div>
        </div>
        <div className="stat-tile">
          <div className="n">{totalShortlist}</div>
          <div className="l">Shortlisted</div>
        </div>
        <div className="stat-tile">
          <div className="n">{totalSelected}</div>
          <div className="l">Selected</div>
        </div>
      </div>

      {closingSoon.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot urgent"></span>
            <h2>Closing within 48 hours</h2>
          </div>
          {closingSoon.map((j) => (
            <div className="card" key={j.id}>
              <div className="card-row">
                <div>
                  <div className="co">{j.company}</div>
                  <div className="meta">Registration closes {fmtDateTime(j.deadline)}</div>
                </div>
                <Link href={`/admin/drives/${j.id}`} className="btn secondary small">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {updatedRecently.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot info"></span>
            <h2>Recently corrected</h2>
          </div>
          {updatedRecently.map((j) => (
            <div className="card" key={j.id}>
              <div className="co">{j.company}</div>
              <div className="meta">{j.changelogs[j.changelogs.length - 1].text}</div>
            </div>
          ))}
        </div>
      )}

      <div className="block">
        <div className="block-head">
          <h2>By company</h2>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Company</th>
              <th>Eligible</th>
              <th>Registered</th>
              <th>Shortlisted</th>
              <th>Interviewed</th>
              <th>Selected</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.job.id}>
                <td>
                  <b>
                    <Link href={`/admin/drives/${s.job.id}`}>{s.job.company}</Link>
                  </b>
                </td>
                <td>{s.eligible}</td>
                <td>{s.registered}</td>
                <td>{s.shortlisted}</td>
                <td>{s.interviewed}</td>
                <td>{s.selected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
