import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Rail from '@/components/Rail';
import LogoutButton from '@/components/LogoutButton';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/create', label: 'Create Drive' },
  { href: '/admin/drives', label: 'Drives' },
  { href: '/admin/students', label: 'Students' }
];

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  return (
    <div id="shell">
      <div id="topbar">
        <a href="/admin/dashboard" className="brand">
          <div className="mark">
            KGEC <span>TNP</span> Hub
          </div>
          <div className="tag">TNP Office</div>
        </a>
        <div className="topbar-right">
          <div className="who">Signed in as TNP Office</div>
          <LogoutButton />
        </div>
      </div>
      <div id="app-layout">
        <Rail groupLabel="TNP Office" items={NAV} />
        <div id="main">
          <div className="view">{children}</div>
        </div>
      </div>
    </div>
  );
}
