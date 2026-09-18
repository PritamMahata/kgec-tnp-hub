import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateApplicationById } from '@/lib/db';
import { statusLabel } from '@/lib/eligibility';

const NOTES = {
  APPLIED: 'Application submitted — await next update',
  SHORTLISTED: 'Shortlisted — watch for the next round schedule',
  ASSESSMENT: 'Attend the scheduled assessment',
  INTERVIEW: 'Attend the scheduled interview',
  SELECTED: 'Selected — submit joining details',
  JOINING: 'Joining formalities in progress',
  REJECTED: 'Not selected for this drive'
};

export async function PATCH(req, props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: 'Status required.' }, { status: 400 });

  const application = updateApplicationById(params.applicationId, status, NOTES[status] || statusLabel(status));
  return NextResponse.json({ ok: true, application });
}
