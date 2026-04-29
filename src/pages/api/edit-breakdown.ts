import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const systemPrompt = `You are an expert video editor and creative director. Analyze Instagram videos and provide detailed editing breakdowns.

For each video, provide:
1. **Overall Editing Style**: Describe the overall aesthetic and approach
2. **Pacing Analysis**: Break down the rhythm, cut frequency, and timing
3. **Transition Techniques**: Identify specific transitions used
4. **Effect Recommendations**: Suggest effects the editor can try to achieve similar results
5. **What Makes It Work**: Summarize the key elements that make this edit effective

Be specific, technical, and actionable. Format your response with clear headings and bullet points.`;

    const userPrompt = `Analyze this Instagram video and provide a detailed editing breakdown: ${videoUrl}

Note: Since I cannot directly view the video, please provide a comprehensive template breakdown that editors can use as a framework when analyzing this specific video themselves.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    const breakdown = data.choices[0]?.message?.content || "No breakdown generated";

    res.status(200).json({ breakdown });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error analyzing video:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
}