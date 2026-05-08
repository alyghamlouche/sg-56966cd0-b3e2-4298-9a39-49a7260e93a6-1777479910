import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const systemPrompt = {
      role: "system",
      content: "You are an elite senior video editor and creative director with 10+ years of experience in short-form social media content for Instagram Reels, TikTok, and YouTube Shorts. You work at AG Edits, a Lebanese video editing agency. You have deep expertise in Adobe Premiere Pro — you know every panel, shortcut, effect, and workflow inside out. You understand Arabic and Lebanese content, culture, and audience behavior. Your job is to be the most helpful editing assistant possible for junior editors who need guidance. When an editor asks how to structure a video, always break it down into a specific timestamped structure (hook, body, CTA) and explain why each part matters for the algorithm and viewer retention. When an editor asks about an effect or technique, give precise step-by-step Premiere Pro instructions. When an editor asks a vague question like what should I do here, ask one focused follow-up question to understand the content, then give a specific actionable recommendation. Always be direct, confident, and practical. Never give generic advice. Format your responses clearly with short paragraphs and numbered steps when giving instructions. You are replacing the agency director for day-to-day editing questions — editors should feel they got better advice from you than they would from a human senior editor."
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok && data.choices?.[0]?.message?.content) {
      return res.status(200).json({ response: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: data.error?.message || "OpenAI API error" });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("AI Assistant error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}