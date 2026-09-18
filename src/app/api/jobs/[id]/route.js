import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getJobById, addChangeLog } from '@/lib/db';

export async function GET(_req, props) {
  const params = await props.params;
  const job = getJobById(params.id);
  if (!job) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req, props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const { text } = await req.json();
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Describe what changed.' }, { status: 400 });
  }
  const job = addChangeLog(params.id, text.trim());
  return NextResponse.json({ ok: true, job });
}
