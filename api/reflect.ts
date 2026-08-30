import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request, res: Response) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { problemTitle, code, language, answer } = req.body;

    if (!problemTitle || !code) {
      return res.status(400).json({ error: 'missing_parameters', message: 'Parameters problemTitle and code are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'placeholder' || apiKey.trim() === '') {
      return res.status(400).json({
        error: 'missing_api_key',
        message: 'Google Gemini API Key configuration is missing. Please configure VITE_GEMINI_API_KEY or GEMINI_API_KEY.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Two modes on the same endpoint:
    //  - No `answer` provided -> generate ONE short comprehension question about
    //    this specific student's specific code (not a generic quiz question).
    //  - `answer` provided -> judge, generously, whether it shows real understanding.
    if (!answer) {
      const prompt = `A student just correctly solved this coding problem: "${problemTitle}".
Their working ${language || 'code'} solution:
${code}

Write ONE short, specific comprehension question about a real decision in THEIR code (e.g. why they used a particular condition, order, or approach) — not a generic definition question. It should be answerable in one or two sentences by someone who actually understands what they wrote, and should NOT be answerable by someone who just copy-pasted the code without understanding it.

Respond ONLY with a single JSON object, no markdown fences, no other text:
{"question": "your question here"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });

      const raw = response.text || '';
      let question = "In your own words, why does your solution work?";
      try {
        const cleaned = raw.trim().replace(/^```json\s*|^```\s*|```$/g, '');
        const parsed = JSON.parse(cleaned);
        if (parsed.question) question = parsed.question;
      } catch {
        if (raw.trim()) question = raw.trim();
      }

      return res.status(200).json({ question });
    } else {
      const prompt = `A student solved this coding problem: "${problemTitle}".
Their code:
${code}

They were asked a comprehension question about their own code, and gave this answer:
"${answer}"

Judge GENEROUSLY (this is a lightweight, low-stakes check, not an exam) whether their answer shows they understand their own solution, even if informally worded or imperfect. Only mark it as not understood if the answer is clearly wrong, off-topic, or looks like they have no idea what their code does.

Respond ONLY with a single JSON object, no markdown fences, no other text:
{"understood": true or false, "feedback": "one short, encouraging sentence"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });

      const raw = response.text || '';
      let understood = true;
      let feedback = "Nice work!";
      try {
        const cleaned = raw.trim().replace(/^```json\s*|^```\s*|```$/g, '');
        const parsed = JSON.parse(cleaned);
        if (typeof parsed.understood === 'boolean') understood = parsed.understood;
        if (parsed.feedback) feedback = parsed.feedback;
      } catch {
        // If parsing fails, default to a generous pass rather than blocking the student
      }

      return res.status(200).json({ understood, feedback });
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini AI Reflect Proxy Error:", err);
    return res.status(500).json({
      error: 'api_failed',
      message: err?.message || 'Failed to process reflection check.'
    });
  }
}
