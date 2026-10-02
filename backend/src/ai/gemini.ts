import { GoogleGenAI, Type, type Part, type Schema } from "@google/genai";

let client: GoogleGenAI | undefined;

export function getGeminiClient() {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini AI is not configured. Set GEMINI_API_KEY in backend/.env.");
  client = new GoogleGenAI({ apiKey });
  return client;
}

export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export { Type };
export type { Part, Schema };

export async function generateJson<T>(prompt: string, responseSchema: Schema, attachments: Part[] = []): Promise<T> {
  const response = await getGeminiClient().models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }, ...attachments] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text) as T;
}
