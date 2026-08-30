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
    const { problemTitle, problemDescription, code, language } = req.body;

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

    const numberedCode = String(code)
      .split('\n')
      .map((line: string, i: number) => `${i + 1}: ${line}`)
      .join('\n');

    const prompt = `You are a helpful coding tutor. A student is working on the following problem and is stuck.
Problem Title: ${problemTitle}
Problem Description: ${problemDescription || "No explicit description provided."}
Student's Current Code (${language || "JavaScript"}), with line numbers prefixed:
${numberedCode}

Please provide a helpful, encouraging hint. Do NOT give the full solution. Focus on pointing out logic errors, suggesting a next step, or explaining a concept they might be missing. Keep it concise.

Respond ONLY with a single JSON object, no markdown fences, no other text, in exactly this shape:
{"hint": "your hint text here", "line": <the 1-based line number most responsible for the issue, or null if there isn't one specific line>}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });

    const raw = response.text || '';
    let hint = "I'm sorry, I couldn't think of a hint right now. Try reviewing the problem requirements!";
    let line: number | null = null;
    try {
      const cleaned = raw.trim().replace(/^```json\s*|^```\s*|```$/g, '');
      const parsed = JSON.parse(cleaned);
      if (parsed.hint) hint = parsed.hint;
      if (typeof parsed.line === 'number' && parsed.line > 0) line = parsed.line;
    } catch {
      // Model didn't return valid JSON — fall back to using the raw text as the hint, no line highlight
      if (raw.trim()) hint = raw.trim();
    }

    return res.status(200).json({ text: hint, line });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini AI Hint Proxy Error:", err);
    return res.status(500).json({
      error: 'api_failed',
      message: err?.message || 'Failed to generate hint.'
    });
  }
}
