import Link from 'next/link';
import { getJobs, getApplicationStatsForJob } from '@/lib/db';
import { urgencyOf } from '@/lib/eligibility';
import { fmtDateTime } from '@/lib/format';

export default function DrivesPage() {
  const jobs = getJobs();

  return (
    <>
      <h1 className="page-title">Drives</h1>
      <p className="page-sub">Every recruitment as one structured record — open a drive to advance stages, add a correction, or attach documents.</p>

      {jobs.map((job) => {
        const stats = getApplicationStatsForJob(job.id);
        const urg = urgencyOf(job.deadline);
        return (
          <div className="card" key={job.id}>
            <div className="card-row">
              <div>
                <div className="co">
                  <Link href={`/admin/drives/${job.id}`}>{job.company}</Link> <span className="meta">v{job.version}</span>
                </div>
                <div className="role">
                  {job.role} · {job.type} · {job.branchList.join(', ')}
                </div>
                <div className="meta">
                  Deadline {fmtDateTime(job.deadline)} · {urg === 'expired' ? 'Closed' : 'Open'} · {stats.registered} applied,{' '}
                  {stats.selected} selected
                </div>
              </div>
              <Link href={`/admin/drives/${job.id}`} className="btn secondary small">
                Manage
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
