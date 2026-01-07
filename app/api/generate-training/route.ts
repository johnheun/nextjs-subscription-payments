import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY in Netlify Environment Variables.");
    }

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

    const textContent = message.content[0].type === 'text' ? message.content[0].text : "No text returned.";

    return NextResponse.json({ lesson: textContent });

  } catch (error: unknown) {
    console.error('AI API Error:', error);
    
    // STRICT FIX: Safely check error type before accessing .message
    const errorMessage = error instanceof Error ? error.message : "Unknown Error";
    const errorType = error instanceof Error ? error.constructor.name : "UnknownType";
    
    return NextResponse.json({ 
      error: true, 
      message: errorMessage,
      type: errorType 
    }, { status: 500 });
  }
}