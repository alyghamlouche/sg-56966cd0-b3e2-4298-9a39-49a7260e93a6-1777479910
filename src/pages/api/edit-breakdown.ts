import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const systemPrompt = `You are an expert video editor and creative director specializing in analyzing editing techniques and styles. Your breakdowns are detailed, technical, and actionable.

Analyze videos and provide comprehensive editing breakdowns using this structure:

## Overall Editing Style
Describe the overall aesthetic, approach, and creative direction

## Pacing Analysis
Break down the rhythm, cut frequency, timing patterns, and flow

## Transition Techniques
Identify and describe specific transitions used (cuts, wipes, dissolves, etc.)

## Effect Recommendations
List specific effects the editor can try to achieve similar results, with technical details

## What Makes It Work
Summarize the key elements that make this edit effective

Use markdown formatting: headings (##), bullet points, numbered lists, and **bold** for emphasis.`;

    const userPrompt = `Analyze this YouTube video and provide a detailed editing breakdown: ${videoUrl}

Since you cannot directly view the video, provide a comprehensive framework breakdown that includes:
1. Common editing patterns for this type of content
2. Industry-standard techniques likely used
3. Specific recommendations for achieving similar results
4. Technical details an editor can apply

Make it actionable and specific.`;

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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    const breakdown = data.choices[0]?.message?.content || "No breakdown generated";

    return res.status(200).json({ breakdown });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Edit Breakdown error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}