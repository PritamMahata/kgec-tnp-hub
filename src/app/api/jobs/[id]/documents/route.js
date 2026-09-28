import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addDocument, getJobById } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';



export async function POST(req, props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const job = await getJobById(params.id);
  if (!job) return NextResponse.json({ error: 'Drive not found.' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'File is larger than 15 MB.' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filePath = `jobs/${job.id}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();
  
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, bytes, { contentType: file.type || 'application/octet-stream' });
    
  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload to Supabase: ' + uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  const updatedJob = await addDocument(job.id, { filename: file.name, url: publicUrlData.publicUrl });
  return NextResponse.json({ ok: true, job: updatedJob });
}
