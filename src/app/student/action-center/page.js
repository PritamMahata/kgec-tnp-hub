import { getSession } from '@/lib/session';
import { getStudentById, getJobs, getApplicationsByStudent } from '@/lib/db';
import { isEligible, urgencyOf } from '@/lib/eligibility';
import { fmtDateTime } from '@/lib/format';
import ApplyButton from '@/components/ApplyButton';
import UpdatesPanel from '@/components/UpdatesPanel';

export default async function ActionCenterPage() {
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const jobs = getJobs();
  const apps = getApplicationsByStudent(student.id);
  const appliedIds = new Set(apps.map((a) => a.job.id));

  const urgent = [];
  const upcoming = [];

  jobs.forEach((j) => {
    if (!appliedIds.has(j.id) && isEligible(j, student) && urgencyOf(j.deadline) !== 'expired') {
      const item = { job: j, text: `Registration closes ${fmtDateTime(j.deadline)}`, applyable: true };
      (urgencyOf(j.deadline) === 'urgent' ? urgent : upcoming).push(item);
    }
  });

  apps.forEach(({ job, application }) => {
    if (!['SELECTED', 'INTERVIEW', 'ASSESSMENT', 'JOINING'].includes(application.status)) return;
    const nextRound = job.rounds.find((r) => r.date && new Date(r.date) > new Date(Date.now() - 6 * 36e5));
    const isUrgent =
      (nextRound && urgencyOf(nextRound.date) === 'urgent') ||
      (application.status === 'SELECTED' && (application.note || '').toLowerCase().includes('joining'));
    const item = { job, text: application.note, applyable: false };
    (isUrgent ? urgent : upcoming).push(item);
  });

  return (
    <>
      <h1 className="page-title">Action Center</h1>
      <p className="page-sub">Do now, then upcoming — nothing else to scroll through.</p>

      <UpdatesPanel jobs={jobs} />

      <div className="block">
        <div className="block-head">
          <span className="dot urgent"></span>
          <h2>Do now</h2>
          <span className="count">{urgent.length}</span>
        </div>
        {urgent.length === 0 ? (
          <div className="empty">Nothing urgent right now.</div>
        ) : (
          urgent.map((item, i) => (
            <div className="card" key={i}>
              <div className="card-row">
                <div>
                  <div className="co">{item.job.company}</div>
                  <div className="meta">{item.text}</div>
                </div>
                {item.applyable ? <ApplyButton jobId={item.job.id} /> : <span className="tagline urgent">Due soon</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="block">
        <div className="block-head">
          <span className="dot upcoming"></span>
          <h2>Upcoming</h2>
          <span className="count">{upcoming.length}</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty">Nothing scheduled beyond this week.</div>
        ) : (
          upcoming.map((item, i) => (
            <div className="card" key={i}>
              <div className="card-row">
                <div>
                  <div className="co">{item.job.company}</div>
                  <div className="meta">{item.text}</div>
                </div>
                {item.applyable ? <ApplyButton jobId={item.job.id} label="Apply" /> : <span className="tagline upcoming">Upcoming</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
