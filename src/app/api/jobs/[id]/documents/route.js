import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSession } from '@/lib/session';
import { addDocument, getJobById } from '@/lib/db';

// Files are written under UPLOAD_DIR (defaults to ./public/uploads), so the
// resulting /uploads/... URL is served directly by Next's static file
// handling. On a serverless host with a read-only/ephemeral filesystem this
// won't persist — swap in S3/R2/etc. here for that kind of deployment (see
// .env.example).
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

export async function POST(req, props) {
  const params = await props.params;
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const job = getJobById(params.id);
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
  const jobDir = path.join(/*turbopackIgnore: true*/ process.cwd(), UPLOAD_DIR.replace(/^\.\//, ''), job.id);
  await mkdir(jobDir, { recursive: true });
  const destPath = path.join(jobDir, `${Date.now()}-${safeName}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(destPath, bytes);

  const publicUrl = '/uploads/' + path.relative(path.join(process.cwd(), 'public/uploads'), destPath).split(path.sep).join('/');

  const updatedJob = addDocument(job.id, { filename: file.name, url: publicUrl });
  return NextResponse.json({ ok: true, job: updatedJob });
}
