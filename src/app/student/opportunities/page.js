import { getSession } from '@/lib/session';
import { getStudentById, getJobs, getApplication } from '@/lib/db';
import { checkEligibility, isEligible, urgencyOf } from '@/lib/eligibility';
import { fmtDateTime } from '@/lib/format';
import ApplyButton from '@/components/ApplyButton';
import OpportunityFilters from '@/components/OpportunityFilters';
import Link from 'next/link';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'Civil'];

export default async function OpportunitiesPage(props) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const branch = searchParams.branch || 'all';
  const type = searchParams.type || 'all';
  const elig = searchParams.elig || 'all';

  let jobs = getJobs();
  jobs = jobs.filter((j) => {
    if (branch !== 'all' && !j.branchList.includes(branch)) return false;
    if (type !== 'all' && j.type !== type) return false;
    if (elig === 'eligible' && !isEligible(j, student)) return false;
    return true;
  });

  return (
    <>
      <h1 className="page-title">Opportunities</h1>
      <p className="page-sub">Every drive shown here is checked against your profile automatically.</p>

      <OpportunityFilters branch={branch} type={type} elig={elig} />

      {jobs.length === 0 && <div className="empty">No drives match these filters.</div>}

      {jobs.map((job) => {
        const checks = checkEligibility(job, student);
        const eligible = checks.every((c) => c.pass);
        const application = getApplication(student.id, job.id);
        const urg = urgencyOf(job.deadline);
        return (
          <div className="card" key={job.id}>
            <div className="card-row">
              <div>
                <div className="co">
                  <Link href={`/student/opportunities/${job.id}`}>{job.company}</Link>{' '}
                  {job.changelogs.length ? <span className="tagline info">Updated</span> : null}
                </div>
                <div className="role">
                  {job.role} · {job.type}
                </div>
                <div className="meta">
                  <b>{job.package}</b> · {job.location} · Branches: {job.branchList.join(', ')}
                </div>
                <div className="meta">
                  Deadline: {fmtDateTime(job.deadline)}
                  {urg === 'urgent' && <span className="tagline urgent" style={{ marginLeft: 6 }}>Closing soon</span>}
                  {urg === 'expired' && <span className="tagline muted" style={{ marginLeft: 6 }}>Closed</span>}
                </div>
                <div className="elig-list">
                  {checks.map((c) => (
                    <span key={c.label} className={`elig-item ${c.pass ? 'pass' : 'fail'}`}>
                      {c.pass ? '✓' : '✕'} {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {application ? (
                  <span className="tagline success">Applied</span>
                ) : eligible ? (
                  urg === 'expired' ? (
                    <span className="tagline muted">Closed</span>
                  ) : (
                    <ApplyButton jobId={job.id} />
                  )
                ) : (
                  <span className="tagline muted">Not eligible</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
