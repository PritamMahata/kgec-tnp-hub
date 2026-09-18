// A deliberately simple session: the cookie holds a base64 JSON blob, not a
// signed/encrypted token. That's fine for a self-hosted college project
// behind normal HTTPS, but before this handles real personal data at scale,
// swap this for NextAuth.js (or your institution's SSO) — everything that
// reads a session goes through getSession() below, so that's the one place
// to change.

import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'tnp_session';

export function encodeSession(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

export function decodeSession(raw) {
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}
