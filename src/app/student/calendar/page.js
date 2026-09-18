import { getSession } from '@/lib/session';
import { getStudentById, getJobs, getApplication } from '@/lib/db';
import { urgencyOf } from '@/lib/eligibility';

export default async function CalendarPage() {
  const session = await getSession();
  const student = getStudentById(session.studentId);
  const jobs = getJobs();

  const items = [];
  jobs.forEach((job) => {
    const applied = !!getApplication(student.id, job.id);
    if (!applied && urgencyOf(job.deadline) !== 'expired') {
      items.push({ date: job.deadline, label: `${job.company} — registration closes` });
    }
    if (applied) {
      job.rounds.forEach((r) => {
        if (r.date && new Date(r.date) > new Date(Date.now() - 6 * 36e5)) {
          items.push({ date: r.date, label: `${job.company} — ${r.name}${r.venue ? ` (${r.venue})` : ''}` });
        }
      });
    }
  });
  items.sort((a, b) => new Date(a.date) - new Date(b.date));

  const byDate = {};
  items.forEach((it) => {
    const key = new Date(it.date).toDateString();
    (byDate[key] = byDate[key] || []).push(it);
  });
  const keys = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <>
      <h1 className="page-title">Calendar</h1>
      <p className="page-sub">Every deadline and round that involves you, in one timeline.</p>

      {keys.length === 0 ? (
        <div className="empty">Nothing on your calendar yet.</div>
      ) : (
        keys.map((k) => {
          const d = new Date(k);
          return (
            <div className="cal-day" key={k}>
              <div className="cal-date">
                <div className="d">{d.getDate()}</div>
                <div className="m">{d.toLocaleDateString('en-IN', { month: 'short' })}</div>
              </div>
              <div className="cal-events">
                {byDate[k].map((it, i) => (
                  <div className="cal-event" key={i}>
                    <span className="t">
                      {new Date(it.date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {it.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
