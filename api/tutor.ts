import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: string;
  text: string;
}

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
    const { messages, systemInstruction } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'missing_messages', message: 'Messages array is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'placeholder' || apiKey.trim() === '') {
      return res.status(400).json({
        error: 'missing_api_key',
        message: 'Google Gemini API Key configuration is missing. Please configure VITE_GEMINI_API_KEY or GEMINI_API_KEY in your Vercel / environment variables settings.'
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

    const formattedContents = (messages as ChatMessage[]).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || "You are a friendly, encouraging coding mentor for LEVELUP students. Some are very new to coding, so explain things simply and clearly without using too much technical jargon. You help with logic, debugging, and general programming questions. Always be supportive and celebrate their learning journey!",
      }
    });

    const reply = response.text || "I'm sorry, I couldn't generate a response.";
    return res.status(200).json({ text: reply });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini AI Tutor Proxy Error:", err);
    return res.status(500).json({
      error: 'api_failed',
      message: err?.message || 'Failed to generate a response from the Google Gemini API.'
    });
  }
}
