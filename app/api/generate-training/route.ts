import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    // 1. Debug: Check if Key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY in Netlify Environment Variables.");
    }

    // Initialize the client inside the request to ensure env var is loaded
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { skillName, mistakeContext, userLevel } = await req.json();

    const prompt = `
    You are an expert Freight Broker Sales Trainer.
    A user just failed a question about "${skillName}".
    
    Context of the mistake:
    ${JSON.stringify(mistakeContext)}

    User's self-rated confidence level: ${userLevel} (where 1=Novice, 5=Expert).

    Action:
    Write a "Micro-Lesson" to correct this specific gap.
    1. Keep it under 150 words.
    2. Use a direct, coaching tone.
    3. Provide one specific script or phrase they should use next time.
    4. Do NOT use markdown formatting like ** or ##. Just plain text.
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // Extract text safely
    const textContent = message.content[0].type === 'text' ? message.content[0].text : "No text returned.";

    return NextResponse.json({ lesson: textContent });

  } catch (error: any) {
    console.error('AI API Error:', error);
    
    // Return the ACTUAL error message to the frontend so we can see it
    return NextResponse.json({ 
      error: true, 
      message: error.message || "Unknown Error",
      type: error.constructor.name 
    }, { status: 500 });
  }
}