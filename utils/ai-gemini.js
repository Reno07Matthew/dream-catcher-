import { GoogleGenAI } from '@google/genai';

// Clean and sanitize the key in case of accidental quotes, spaces, or prefix in Render env
function sanitizeApiKey(rawKey) {
  if (!rawKey) return null;
  let key = rawKey.trim();
  // Remove wrapping quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  // Remove accidental variable name prefix (e.g. GEMINI_API_KEY=...)
  if (key.startsWith('GEMINI_API_KEY=')) {
    key = key.replace('GEMINI_API_KEY=', '').trim();
  }
  return key;
}

// Call Gemini API for dream interpretation
export async function getDreamInterpretation(dreamText) {
  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = sanitizeApiKey(rawKey);

  if (!apiKey) {
    throw new Error('Server misconfigured: GEMINI_API_KEY is missing');
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model,
      contents: `Dream: ${dreamText}`,
      config: {
        systemInstruction:
          'You are a thoughtful dream interpreter. Be insightful but gentle, and consider common dream symbolism. Keep your interpretation to 2-3 paragraphs.'
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    console.error(
      `Key diagnostics: length=${apiKey.length}, startsWith=${apiKey.slice(0, 4)}..., endsWith=...${apiKey.slice(-4)}`
    );
    throw new Error(`API error: ${error.message}`);
  }
}
