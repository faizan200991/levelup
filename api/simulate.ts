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
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'missing_parameters', message: 'Parameter code is required.' });
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

    const prompt = `You are a code execution engine. Analyze the following ${language || 'JavaScript'} code and provide the exact output it would produce. If there are syntax errors, provide the error message. Do not include any explanation, just the raw output.\n\nCode:\n${code}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const reply = response.text || 'No output produced.';
    return res.status(200).json({ text: reply });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Gemini AI Simulation Proxy Error:", err);
    return res.status(500).json({
      error: 'api_failed',
      message: err?.message || 'Failed to simulate execution.'
    });
  }
}
