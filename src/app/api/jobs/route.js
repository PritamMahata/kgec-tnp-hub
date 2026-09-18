import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createJob } from '@/lib/db';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const body = await req.json();

  if (!body.company || !body.role || !body.deadline || !Array.isArray(body.branches) || body.branches.length === 0) {
    return NextResponse.json({ error: 'Company, role, at least one branch, and a deadline are required.' }, { status: 400 });
  }

  const job = createJob({
    company: body.company.trim(),
    role: body.role.trim(),
    type: body.type || 'Placement',
    batch: body.batch || '2027',
    branches: body.branches,
    minCgpa: parseFloat(body.minCgpa) || 0,
    min10: parseFloat(body.min10) || 0,
    min12: parseFloat(body.min12) || 0,
    backlogAllowed: !!body.backlogAllowed,
    package: body.package?.trim() || '—',
    location: body.location?.trim() || '—',
    deadline: body.deadline,
    rounds: Array.isArray(body.rounds) ? body.rounds : []
  });

  return NextResponse.json({ ok: true, job });
}
