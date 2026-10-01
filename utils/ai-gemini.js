
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Call Gemini API for dream interpretation
export async function getDreamInterpretation(dreamText) {

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Server misconfigured: GEMINI_API_KEY is missing');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {

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

    throw new Error(`API error: ${error.message}`);
  }
}

