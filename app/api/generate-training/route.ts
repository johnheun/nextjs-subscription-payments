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

    // CALIBRATION LOGIC FOR CLAUDE
    // We explain exactly what the "mistakeContext" means so it doesn't guess.
    let calibrationGuidance = "";
    if (mistakeContext === 'overconfident') {
      calibrationGuidance = "The user was High Confidence but Wrong. They have a 'Blind Spot'. Be firm but encouraging. Show them why their 'expert' assumption failed.";
    } else if (mistakeContext === 'underconfident') {
      calibrationGuidance = "The user was Low Confidence but Correct. They have 'Imposter Syndrome'. Validate their knowledge and boost their certainty.";
    } else if (mistakeContext === 'novice') {
      calibrationGuidance = "The user was Low Confidence and Wrong. They are a beginner. Keep the simulation simple and foundational.";
    } else {
      calibrationGuidance = "The user made a standard mistake. Focus on correction.";
    }

    const prompt = `
    You are an expert Freight Broker Sales Mentor. 
    Your goal is to fix a specific skill gap through active practice, NOT lecturing.
    
    The User failed a question on: "${skillName}".
    User Calibration State: ${calibrationGuidance} (Self-Rating: ${userLevel}/5).

    Action:
    Create a short "Roleplay Simulation" for the user to practice immediately.
    
    Output MUST be valid JSON with this exact structure:
    {
      "setup": "One sentence setting the scene.",
      "customer_dialogue": "What the angry/busy customer says to the broker.",
      "options": [
        { "id": "A", "text": "A weak or passive response.", "feedback": "Explain why this fails." },
        { "id": "B", "text": "The 'Trap' response (sounds good but is wrong).", "feedback": "Explain the trap." },
        { "id": "C", "text": "The Best Practice response.", "feedback": "Explain why this wins." }
      ],
      "correct_option_id": "C"
    }

    Do not include any text outside the JSON object.
    `;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // Extract text safely
    let textContent = message.content[0].type === 'text' ? message.content[0].text : "";
    
    // Clean up potential markdown code blocks if Claude adds them
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse JSON to ensure it is valid before sending to UI
    const simulationData = JSON.parse(textContent);

    return NextResponse.json(simulationData);

  } catch (error: unknown) {
    console.error('AI API Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown Error";
    return NextResponse.json({ error: true, message: errorMessage }, { status: 500 });
  }
}