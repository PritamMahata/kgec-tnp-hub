import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getJobById, addChangeLog } from '@/lib/db';

export async function GET(_req, props) {
  const params = await props.params;
  const job = await getJobById(params.id);
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
  const job = await addChangeLog(params.id, text.trim());
  return NextResponse.json({ ok: true, job });
}

export async function PUT(req, props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  
  const body = await req.json();
  const { updateJob } = require('@/lib/db');
  
  try {
    const job = await updateJob(params.id, body);
    return NextResponse.json({ ok: true, job });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
