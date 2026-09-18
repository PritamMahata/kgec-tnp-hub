import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { parseNoticeWithAI } from '@/lib/ai';
import { createNoticeDraft } from '@/lib/db';

export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not signed in as TNP Office.' }, { status: 401 });
  }
  const { rawText } = await req.json();
  if (!rawText || !rawText.trim()) {
    return NextResponse.json({ error: 'Paste the notice text first.' }, { status: 400 });
  }

  try {
    const parsed = await parseNoticeWithAI(rawText);
    const draft = createNoticeDraft(rawText, parsed);
    return NextResponse.json({ ok: true, draftId: draft.id, parsed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
