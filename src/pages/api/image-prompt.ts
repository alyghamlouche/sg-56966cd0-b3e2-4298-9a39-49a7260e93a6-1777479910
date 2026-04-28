import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { concept } = req.body;

  if (!concept) {
    return res.status(400).json({ error: "Concept is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const systemPrompt = `You are an expert prompt engineer for AI image generation tools like Midjourney and DALL·E. Your job is to transform simple image concepts into highly detailed, professional prompts that produce stunning, high-quality images.

Include specific details about:
- Visual style and mood
- Lighting and atmosphere
- Camera angle and perspective
- Color palette
- Texture and materials
- Composition and framing
- Quality modifiers (8k, photorealistic, etc.)

Make prompts vivid, specific, and optimized for AI image generation.`;

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
          { role: "user", content: `Create a detailed image generation prompt for this concept: ${concept}` },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    const prompt = data.choices[0]?.message?.content || "No prompt generated";

    return res.status(200).json({ prompt });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Image Prompt error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}