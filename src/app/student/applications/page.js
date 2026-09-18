import { getSession } from '@/lib/session';
import { getStudentById, getApplicationsByStudent } from '@/lib/db';
import { PIPELINE_STAGES, statusLabel } from '@/lib/eligibility';
import Link from 'next/link';

function statusColor(status) {
  if (status === 'SELECTED' || status === 'JOINING') return 'success';
  if (status === 'REJECTED') return 'muted';
  if (status === 'INTERVIEW' || status === 'ASSESSMENT') return 'upcoming';
  return 'info';
}

function Pipeline({ status }) {
  const idx = PIPELINE_STAGES.indexOf(status);
  return (
    <div className="pipeline">
      {PIPELINE_STAGES.map((s, i) => {
        let cls = '';
        if (idx >= 0 && i < idx) cls = 'done';
        if (i === idx) cls = 'now';
        return (
          <span className={`stg ${cls}`} key={s}>
            {statusLabel(s)}
          </span>
        );
      })}
    </div>
  );
}

export default async function ApplicationsPage() {
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const apps = getApplicationsByStudent(student.id);

  return (
    <>
      <h1 className="page-title">My Applications</h1>
      <p className="page-sub">Your full status history, without digging through messages.</p>

      {apps.length === 0 ? (
        <div className="empty">
          You haven't applied to anything yet. Head to{' '}
          <Link href="/student/opportunities">Opportunities</Link> to get started.
        </div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Company</th>
              <th>Status</th>
              <th>Pipeline</th>
              <th>Next action</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(({ job, application }) => (
              <tr key={job.id}>
                <td>
                  <b>
                    <Link href={`/student/opportunities/${job.id}`}>{job.company}</Link>
                  </b>
                  <br />
                  <span className="meta">{job.role}</span>
                </td>
                <td>
                  <span className={`tagline ${statusColor(application.status)}`}>{statusLabel(application.status)}</span>
                </td>
                <td>
                  <Pipeline status={application.status} />
                </td>
                <td className="meta">{application.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
