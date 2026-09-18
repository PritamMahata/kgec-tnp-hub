import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addRound } from '@/lib/db';

export async function POST(req, props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Round name is required.' }, { status: 400 });
  }
  const job = addRound(params.id, {
    name: body.name.trim(),
    date: body.date ? new Date(body.date).toISOString() : null,
    venue: body.venue || null
  });
  return NextResponse.json({ ok: true, job });
}
