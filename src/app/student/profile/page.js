import { getSession } from '@/lib/session';
import { getStudentById } from '@/lib/db';
import ProfileForm from '@/components/ProfileForm';

export default async function ProfilePage() {
  const session = await getSession();
  const student = getStudentById(session.studentId);

  return (
    <>
      <h1 className="page-title">My Profile</h1>
      <p className="page-sub">This is what the eligibility engine checks every drive against.</p>
      <ProfileForm student={student} />
      <p className="page-sub" style={{ marginTop: 14 }}>
        Change any field and check the Opportunities tab — eligibility recalculates instantly.
      </p>
    </>
  );
}
