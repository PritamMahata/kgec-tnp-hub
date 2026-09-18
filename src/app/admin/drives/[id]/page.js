import { notFound } from 'next/navigation';
import { getJobById, getApplicantsForJob, getEligibleCountForJob } from '@/lib/db';
import { statusLabel, urgencyOf } from '@/lib/eligibility';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { CorrectionForm, DocumentUpload, AddRoundForm, ApplicantStatusSelect } from '@/components/AdminDriveWidgets';

export default async function AdminDriveDetail(props) {
  const params = await props.params;
  const job = getJobById(params.id);
  if (!job) notFound();

  const applicants = getApplicantsForJob(job.id);
  const eligibility = getEligibleCountForJob(job);
  const urg = urgencyOf(job.deadline);

  return (
    <>
      <h1 className="page-title">{job.company}</h1>
      <p className="page-sub">
        {job.role} · {job.type} · v{job.version} · {urg === 'expired' ? 'Closed' : 'Open'}
      </p>

      <div className="card" style={{ marginBottom: 22 }}>
        <div className="meta" style={{ fontSize: 13.5 }}>
          <div>
            <b>Package:</b> {job.package} &nbsp; <b>Location:</b> {job.location}
          </div>
          <div>
            <b>Batch:</b> {job.batch} &nbsp; <b>Branches:</b> {job.branchList.join(', ')}
          </div>
          <div>
            <b>CGPA ≥ {job.minCgpa}</b> · <b>10th ≥ {job.min10}%</b> · <b>12th ≥ {job.min12}%</b> ·{' '}
            <b>Backlog {job.backlogAllowed ? 'allowed' : 'not allowed'}</b>
          </div>
          <div>
            <b>Deadline:</b> {fmtDateTime(job.deadline)}
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Automatic eligibility</h2>
        </div>
        <div className="stat-row">
          <div className="stat-tile">
            <div className="n">{eligibility.total}</div>
            <div className="l">Eligible students</div>
          </div>
          {Object.entries(eligibility.byBranch).map(([b, n]) => (
            <div className="stat-tile" key={b}>
              <div className="n">{n}</div>
              <div className="l">{b}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Correction / version history</h2>
        </div>
        {job.changelogs.map((c) => (
          <div className="card" key={c.id}>
            <div className="meta">
              ⚠ {c.text} — {fmtDate(c.date)}
            </div>
          </div>
        ))}
        <CorrectionForm jobId={job.id} />
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Selection rounds</h2>
        </div>
        {job.rounds.length > 0 && (
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
        )}
        <AddRoundForm jobId={job.id} />
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Documents</h2>
        </div>
        {job.documents.length > 0 && (
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
        <DocumentUpload jobId={job.id} />
      </div>

      <div className="block">
        <div className="block-head">
          <h2>Applicants</h2>
          <span className="count">{applicants.length}</span>
        </div>
        {applicants.length === 0 ? (
          <div className="empty">No one has applied to this drive yet.</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {applicants.slice(0, 60).map((a) => (
                <tr key={a.applicationId}>
                  <td className="mono">
                    {a.roll} {a.isDemo ? <span className="tagline info">Demo login</span> : null}
                  </td>
                  <td>{a.branch}</td>
                  <td>
                    <span className="tagline info">{statusLabel(a.status)}</span>
                  </td>
                  <td>
                    <ApplicantStatusSelect applicationId={a.applicationId} status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {applicants.length > 60 && (
          <p className="page-sub" style={{ marginTop: 10 }}>
            Showing 60 of {applicants.length} applicants.
          </p>
        )}
      </div>
    </>
  );
}
