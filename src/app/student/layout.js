import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getStudentById } from '@/lib/db';
import { getApplicationsByStudent, getJobs } from '@/lib/db';
import { isEligible, urgencyOf } from '@/lib/eligibility';
import Rail from '@/components/Rail';
import LogoutButton from '@/components/LogoutButton';

const NAV = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/opportunities', label: 'Opportunities' },
  { href: '/student/applications', label: 'My Applications' },
  { href: '/student/calendar', label: 'Calendar' },
  { href: '/student/action-center', label: 'Action Center' },
  { href: '/student/profile', label: 'My Profile' }
];

export default async function StudentLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== 'student') redirect('/login');
  const student = getStudentById(session.studentId);
  if (!student) redirect('/login');

  // Urgent-action badge count for the Action Center nav item.
  const jobs = getJobs();
  const apps = getApplicationsByStudent(student.id);
  const appliedIds = new Set(apps.map((a) => a.job.id));
  let urgentCount = 0;
  jobs.forEach((j) => {
    if (!appliedIds.has(j.id) && isEligible(j, student) && urgencyOf(j.deadline) === 'urgent') urgentCount++;
  });
  apps.forEach((a) => {
    if (a.application.status === 'SELECTED' && (a.application.note || '').toLowerCase().includes('joining')) urgentCount++;
  });

  const navWithBadge = NAV.map((item) =>
    item.href === '/student/action-center' && urgentCount > 0 ? { ...item, badge: urgentCount } : item
  );

  return (
    <div id="shell">
      <div id="topbar">
        <a href="/student/dashboard" className="brand">
          <div className="mark">
            KGEC <span>TNP</span> Hub
          </div>
          <div className="tag">Placement workflow, in one place</div>
        </a>
        <div className="topbar-right">
          <div className="who">
            <b>{student.name}</b> · {student.roll}
          </div>
          <LogoutButton />
        </div>
      </div>
      <div id="app-layout">
        <Rail groupLabel="Student" items={navWithBadge} />
        <div id="main">
          <div className="view">{children}</div>
        </div>
      </div>
    </div>
  );
}
