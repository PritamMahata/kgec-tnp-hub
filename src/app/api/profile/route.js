import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateStudent } from '@/lib/db';

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  const body = await req.json();
  const allowed = ['name', 'roll', 'batch', 'branch', 'cgpa', 'tenth', 'twelfth', 'backlog'];
  const fields = {};
  for (const key of allowed) {
    if (key in body) {
      fields[key] = ['cgpa', 'tenth', 'twelfth'].includes(key) ? parseFloat(body[key]) : body[key];
    }
  }
  const student = updateStudent(session.studentId, fields);
  return NextResponse.json({ ok: true, student });
}
