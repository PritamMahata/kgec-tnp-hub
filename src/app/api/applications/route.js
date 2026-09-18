import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getJobById, getStudentById, createApplication } from '@/lib/db';
import { isEligible, urgencyOf } from '@/lib/eligibility';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  const { jobId } = await req.json();
  const job = getJobById(jobId);
  const student = getStudentById(session.studentId);
  if (!job || !student) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (urgencyOf(job.deadline) === 'expired') {
    return NextResponse.json({ error: 'Registration for this drive has closed.' }, { status: 400 });
  }
  if (!isEligible(job, student)) {
    return NextResponse.json({ error: "You don't meet the eligibility criteria for this drive." }, { status: 400 });
  }

  const application = createApplication(student.id, job.id);
  return NextResponse.json({ ok: true, application });
}
