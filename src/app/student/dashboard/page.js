import { getSession } from '@/lib/session';
import { getStudentById, getJobs, getApplicationsByStudent } from '@/lib/db';
import { isEligible, urgencyOf } from '@/lib/eligibility';
import { fmtDateTime } from '@/lib/format';
import ApplyButton from '@/components/ApplyButton';
import Link from 'next/link';

export default async function StudentDashboard() {
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const jobs = getJobs();
  const apps = getApplicationsByStudent(student.id);
  const appliedIds = new Set(apps.map((a) => a.job.id));

  const eligibleOpen = jobs.filter((j) => isEligible(j, student) && urgencyOf(j.deadline) !== 'expired');
  const newOpportunities = eligibleOpen.filter((j) => !appliedIds.has(j.id));

  const urgentActions = [];
  eligibleOpen.forEach((j) => {
    if (!appliedIds.has(j.id) && urgencyOf(j.deadline) === 'urgent') {
      urgentActions.push({ job: j, text: `Registration closes ${fmtDateTime(j.deadline)}`, applyable: true });
    }
  });
  apps.forEach(({ job, application }) => {
    if (application.status === 'SELECTED' || application.status === 'INTERVIEW' || application.status === 'ASSESSMENT') {
      const nextRound = job.rounds.find((r) => r.date && new Date(r.date) > new Date(Date.now() - 6 * 36e5));
      const urgent =
        (nextRound && urgencyOf(nextRound.date) === 'urgent') ||
        (application.status === 'SELECTED' && (application.note || '').toLowerCase().includes('joining'));
      if (urgent) urgentActions.push({ job, text: application.note, applyable: false });
    }
  });

  const upcoming = [];
  apps.forEach(({ job }) => {
    job.rounds.forEach((r) => {
      if (r.date && new Date(r.date) > new Date(Date.now() - 6 * 36e5)) {
        upcoming.push({ job, name: r.name, date: r.date, venue: r.venue });
      }
    });
  });
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <>
      <h1 className="page-title">Good morning, {student.name.split(' ')[0]}</h1>
      <p className="page-sub">
        Roll {student.roll} · {student.branch}, Batch {student.batch}
      </p>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="n">{eligibleOpen.length}</div>
          <div className="l">Open jobs for you</div>
        </div>
        <div className="stat-tile">
          <div className="n">{apps.length}</div>
          <div className="l">Applications</div>
        </div>
        <div className="stat-tile">
          <div className="n">{urgentActions.length}</div>
          <div className="l">Actions needed</div>
        </div>
        <div className="stat-tile">
          <div className="n">{upcoming.length}</div>
          <div className="l">Events this week</div>
        </div>
      </div>

      {urgentActions.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot urgent"></span>
            <h2>Action required</h2>
          </div>
          {urgentActions.map((item, i) => (
            <div className="card" key={i}>
              <div className="card-row">
                <div>
                  <div className="co">{item.job.company}</div>
                  <div className="meta">{item.text}</div>
                </div>
                {item.applyable ? (
                  <ApplyButton jobId={item.job.id} />
                ) : (
                  <span className="tagline urgent">Due soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot upcoming"></span>
            <h2>Upcoming</h2>
          </div>
          {upcoming.slice(0, 3).map((e, i) => (
            <div className="card" key={i}>
              <div className="co">
                {e.job.company} — {e.name}
              </div>
              <div className="meta">
                {fmtDateTime(e.date)}
                {e.venue ? ` · ${e.venue}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {newOpportunities.length > 0 && (
        <div className="block">
          <div className="block-head">
            <span className="dot info"></span>
            <h2>New opportunities for you</h2>
          </div>
          {newOpportunities.slice(0, 3).map((j) => (
            <div className="card" key={j.id}>
              <div className="card-row">
                <div>
                  <div className="co">
                    <Link href={`/student/opportunities/${j.id}`}>{j.company}</Link>
                  </div>
                  <div className="role">
                    {j.role} · {j.type}
                  </div>
                  <div className="meta">
                    <b>{j.package}</b> · {j.location} · Deadline {fmtDateTime(j.deadline)}
                  </div>
                </div>
                <ApplyButton jobId={j.id} />
              </div>
            </div>
          ))}
          {newOpportunities.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <Link href="/student/opportunities" className="btn secondary small">
                See all {newOpportunities.length}
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
