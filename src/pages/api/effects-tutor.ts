import type { NextApiRequest, NextApiResponse } from "next";

const SOFTWARE_NAMES: Record<string, string> = {
  premiere: "Adobe Premiere Pro",
  aftereffects: "After Effects",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { effect, software, difficulty } = req.body;

  if (!effect || !software || !difficulty) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const softwareName = SOFTWARE_NAMES[software] || software;
  const systemPrompt = "You are an expert video editor and instructor specializing in Adobe Premiere Pro and After Effects. Your tutorials are clear, detailed, and actionable.";
  
  const userPrompt = `Create a clear, numbered step-by-step tutorial for creating the following effect in ${softwareName}. Tailor the tutorial for a ${difficulty} level user.

Effect: ${effect}

Provide detailed, actionable steps. Include specific menu paths, keyboard shortcuts, settings, and values where relevant. Format your response with proper markdown: use headings (##), numbered lists, and **bold** for important terms. Make it easy to follow.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    const tutorial = data.choices[0]?.message?.content || "No tutorial generated";

    return res.status(200).json({ tutorial });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Effects Tutor error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}