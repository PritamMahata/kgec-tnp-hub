const SYSTEM_PROMPT = `You extract structured campus-recruitment data from a pasted notice (often a forwarded WhatsApp message, sometimes messy, with line breaks and emoji).

Return ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:

{
  "company": string,
  "role": string,
  "type": "Placement" | "Internship",
  "batch": string,
  "branches": string[],           // from ["CSE","IT","ECE","EE","ME","Civil"], best guess if unclear
  "minCgpa": number,
  "min10": number,
  "min12": number,
  "backlogAllowed": boolean,
  "package": string,              // as written, e.g. "₹6 LPA" or "₹25,000/mo"
  "location": string,
  "deadline": string | null,      // ISO 8601 if a date+time is stated, else null
  "rounds": [{ "name": string, "date": string | null, "venue": string | null }],
  "requirements": string[],       // e.g. "Laptop", "Webcam" — empty array if none mentioned
  "confidence": "high" | "medium" | "low",
  "notes": string                 // anything the admin should double-check, empty string if nothing
}

Rules:
- If a field truly is not present in the text, use a reasonable default (0 for numeric minimums, false for backlogAllowed, [] for arrays, null for deadline) and lower "confidence" accordingly — never invent a specific number or date that was not stated or clearly implied.
- Never omit a key.
- Output valid JSON and nothing else.`;

export async function parseNoticeWithAI(rawText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env to enable the AI notice parser.');
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawText }]
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Anthropic API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('The model did not return valid JSON. Try again, or trim the pasted text.');
  }
  return parsed;
}
