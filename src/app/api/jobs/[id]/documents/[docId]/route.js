import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { deleteDocument, getJobById } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(req, props) {
  const params = await props.params;
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }

  const job = await getJobById(params.id);
  if (!job) {
    return NextResponse.json({ error: 'Drive not found.' }, { status: 404 });
  }

  const doc = job.documents.find(d => d.id === params.docId);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  try {
    const updatedJob = await deleteDocument(params.id, params.docId);

    // If it's a Supabase storage URL, parse the file path
    const urlMatches = doc.url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
    if (urlMatches && urlMatches[1]) {
      const filePath = urlMatches[1];
      const { error } = await supabase.storage.from('uploads').remove([filePath]);
      if (error) {
        console.error('Failed to delete file from Supabase storage:', error);
      }
    }

    return NextResponse.json({ ok: true, job: updatedJob });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
