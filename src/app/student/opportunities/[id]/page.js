import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getStudentById, getJobById, getApplication } from '@/lib/db';
import { checkEligibility, urgencyOf } from '@/lib/eligibility';
import { fmtDate, fmtDateTime } from '@/lib/format';
import ApplyButton from '@/components/ApplyButton';

export default async function OpportunityDetail(props) {
  const params = await props.params;
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const job = getJobById(params.id);
  if (!job) notFound();

  const checks = checkEligibility(job, student);
  const eligible = checks.every((c) => c.pass);
  const application = getApplication(student.id, job.id);
  const urg = urgencyOf(job.deadline);

  return (
    <>
      <h1 className="page-title">{job.company}</h1>
      <p className="page-sub">
        {job.role} · {job.type} · v{job.version}
      </p>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-row">
          <div className="meta" style={{ fontSize: 13.5 }}>
            <div>
              <b>Package:</b> {job.package}
            </div>
            <div>
              <b>Location:</b> {job.location}
            </div>
            <div>
              <b>Batch:</b> {job.batch} &nbsp; <b>Branches:</b> {job.branchList.join(', ')}
            </div>
            <div>
              <b>Registration deadline:</b> {fmtDateTime(job.deadline)}{' '}
              {urg === 'urgent' && <span className="tagline urgent">Closing soon</span>}
              {urg === 'expired' && <span className="tagline muted">Closed</span>}
            </div>
          </div>
          <div>
            {application ? (
              <span className="tagline success">Applied — {application.status}</span>
            ) : eligible ? (
              urg === 'expired' ? (
                <span className="tagline muted">Closed</span>
              ) : (
                <ApplyButton jobId={job.id} label="Apply now" />
              )
            ) : (
              <span className="tagline muted">Not eligible</span>
            )}
          </div>
        </div>
        <div className="elig-list">
          {checks.map((c) => (
            <span key={c.label} className={`elig-item ${c.pass ? 'pass' : 'fail'}`}>
              {c.pass ? '✓' : '✕'} {c.label}
            </span>
          ))}
        </div>
      </div>

      {job.changelogs.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot info"></span>
            <h2>Version history</h2>
          </div>
          {job.changelogs.map((c) => (
            <div className="card" key={c.id}>
              <div className="meta">
                ⚠ {c.text} — {fmtDate(c.date)}
              </div>
            </div>
          ))}
        </div>
      )}

      {job.rounds.length > 0 && (
        <div className="block">
          <div className="block-head">
            <h2>Selection process</h2>
          </div>
          <div className="card">
            <div className="pipeline">
              {job.rounds.map((r) => (
                <span className="stg" key={r.id} title={r.venue || ''}>
                  {r.name}
                  {r.date ? ` — ${fmtDateTime(r.date)}` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <div className="block">
          <div className="block-head">
            <h2>What you'll need</h2>
          </div>
          <div className="card">
            <div className="elig-list">
              {job.requirements.map((r) => (
                <span key={r} className="elig-item pass">
                  ✓ {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="block">
        <div className="block-head">
          <h2>Documents</h2>
        </div>
        {job.documents.length === 0 ? (
          <div className="empty">No documents attached yet.</div>
        ) : (
          <div className="card">
            {job.documents.map((d) => (
              <div className="doc-item" key={d.id}>
                <span>📄 {d.filename}</span>
                <a className="btn secondary small" href={d.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
