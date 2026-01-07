import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize the client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
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
    const textContent = message.content[0].type === 'text' ? message.content[0].text : "Error generating lesson.";

    return NextResponse.json({ lesson: textContent });

  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: 'Failed to generate training' }, { status: 500 });
  }
}