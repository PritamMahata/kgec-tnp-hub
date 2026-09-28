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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env to enable the AI notice parser.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        { role: 'user', parts: [{ text: rawText }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  
  let text = '';
  try {
    text = data.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error('Unexpected response structure from Gemini API.');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('The model did not return valid JSON. Try again, or trim the pasted text.');
  }
  return parsed;
}
