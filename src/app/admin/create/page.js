import CreateDriveForm from '@/components/CreateDriveForm';

export default function CreateDrivePage() {
  return (
    <>
      <h1 className="page-title">Create Recruitment Drive</h1>
      <p className="page-sub">Publish once — eligible students see it instantly, with their eligibility already checked.</p>
      <CreateDriveForm />
    </>
  );
}
