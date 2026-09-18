import { NextResponse } from 'next/server';
import { getStudentByRoll, createStudent } from '@/lib/db';
import { encodeSession, SESSION_COOKIE } from '@/lib/session';

export async function POST(req) {
  const body = await req.json();

  if (body.role === 'admin') {
    const expected = process.env.ADMIN_PASSCODE || 'tnpadmin';
    if (body.passcode !== expected) {
      return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, redirect: '/admin/dashboard' });
    res.cookies.set(SESSION_COOKIE, encodeSession({ role: 'admin' }), { httpOnly: true, path: '/', sameSite: 'lax' });
    return res;
  }

  const roll = (body.roll || '').trim();
  if (!roll) {
    return NextResponse.json({ error: 'Enter a roll number.' }, { status: 400 });
  }

  let student = getStudentByRoll(roll);
  if (!student) {
    student = createStudent({
      name: body.name?.trim() || roll,
      roll,
      batch: body.batch?.trim() || '2027',
      branch: body.branch || 'CSE',
      cgpa: parseFloat(body.cgpa) || 7.0,
      tenth: parseFloat(body.tenth) || 70,
      twelfth: parseFloat(body.twelfth) || 70,
      backlog: false
    });
  }

  const res = NextResponse.json({ ok: true, redirect: '/student/dashboard' });
  res.cookies.set(SESSION_COOKIE, encodeSession({ role: 'student', studentId: student.id }), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
