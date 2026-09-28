import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateStudent, getStudentById } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';



export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Not signed in as a student.' }, { status: 401 });
  }

  const data = await req.formData();
  const file = data.get('file');
  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const allowed = ['pdf'];
  if (!allowed.includes(ext.toLowerCase())) {
    return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const student = await getStudentById(session.studentId);
  const path = `cvs/${student.roll}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('uploads').upload(path, buffer, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    console.error(uploadError);
    return NextResponse.json({ error: 'Failed to upload to Supabase: ' + uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const updatedStudent = await updateStudent(student.id, {
    cvUrl: publicUrl,
    cvFilename: file.name
  });

  return NextResponse.json({ ok: true, student: updatedStudent });
}
