import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getJobById } from '@/lib/db';
import CreateDriveForm from '@/components/CreateDriveForm';
import Link from 'next/link';

export default async function EditDrivePage(props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const job = await getJobById(params.id);
  if (!job) redirect('/admin/drives');

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Link href={`/admin/drives/${job.id}`} className="tagline muted" style={{ textDecoration: 'none' }}>
          ← Back to drive
        </Link>
      </div>
      <h1 className="page-title">Edit Drive</h1>
      <p className="page-sub">Update the details for {job.company}</p>
      
      <CreateDriveForm initialData={job} />
    </>
  );
}
