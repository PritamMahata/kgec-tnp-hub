import { NextResponse } from 'next/server';
import { getStudentByRoll, createStudent } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req) {
  const body = await req.json();
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  if (body.action === 'login') {
    const { error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 401 });
    
    // Determine redirect based on role
    const { data: { user } } = await supabase.auth.getUser();
    if (user.user_metadata?.role === 'admin') {
      return NextResponse.json({ ok: true, redirect: '/admin/dashboard' });
    }
    return NextResponse.json({ ok: true, redirect: '/student/dashboard' });
  }

  if (body.action === 'signup') {
    if (body.role === 'admin') {
      // Special admin signup (you'd normally secure this better, but for demo it's fine)
      const expected = process.env.ADMIN_PASSCODE || 'tnpadmin';
      if (body.passcode !== expected) {
        return NextResponse.json({ error: 'Incorrect TNP Office passcode.' }, { status: 401 });
      }
      
      const { error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: { role: 'admin', full_name: 'TNP Office' }
        }
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, redirect: '/admin/dashboard' });
    }

    // Student Signup
    const roll = (body.roll || '').trim();
    if (!roll) return NextResponse.json({ error: 'Enter a roll number.' }, { status: 400 });

    let student = await getStudentByRoll(roll);
    if (!student) {
      student = await createStudent({
        email: body.email,
        name: body.name?.trim() || roll,
        roll,
        batch: body.batch?.trim() || '2027',
        branch: body.branch || 'CSE',
        course: body.course || 'BTECH',
        mobile: body.mobile || '',
        cgpa: parseFloat(body.cgpa) || 7.0,
        tenth: parseFloat(body.tenth) || 70,
        twelfth: parseFloat(body.twelfth) || 70,
        backlog: false
      });
    }

    const { error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: { 
          role: 'student', 
          studentId: student.id,
          full_name: student.name,
          phone: student.mobile || ''
        }
      }
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, redirect: '/student/dashboard' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
