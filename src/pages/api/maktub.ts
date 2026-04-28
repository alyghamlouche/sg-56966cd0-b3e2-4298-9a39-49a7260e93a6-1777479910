import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function convertToSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  let srt = "";
  segments.forEach((segment, index) => {
    const startTime = formatTime(segment.start);
    const endTime = formatTime(segment.end);
    srt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
  });
  return srt;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const language = Array.isArray(fields.language) ? fields.language[0] : fields.language;

    if (!audioFile || !language) {
      return res.status(400).json({ error: "Audio file and language are required" });
    }

    const file = audioFile as FormidableFile;
    const audioBuffer = fs.readFileSync(file.filepath);

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    formData.append("file", blob, "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    if (language === "english") {
      formData.append("language", "en");
    } else if (language === "arabic" || language === "fusha" || language === "arabizi") {
      formData.append("language", "ar");
    }

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const whisperData = await whisperResponse.json();

    if (!whisperResponse.ok) {
      throw new Error(whisperData.error?.message || "Whisper API error");
    }

    let segments = whisperData.segments || [];
    const transcriptText = whisperData.text;

    if (language === "arabizi" && transcriptText) {
      const arabiziPrompt = `Convert this Arabic text to Arabizi (Arabic written in Latin characters). Use common conventions like 3 for ع, 7 for ح, 2 for ء, etc. Only output the Arabizi text, nothing else.\n\nArabic text: ${transcriptText}`;

      const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are an expert in Arabic-to-Arabizi transliteration." },
            { role: "user", content: arabiziPrompt },
          ],
          temperature: 0.3,
        }),
      });

      const gptData = await gptResponse.json();

      if (gptResponse.ok && gptData.choices?.[0]?.message?.content) {
        const arabiziText = gptData.choices[0].message.content.trim();
        segments = segments.map((seg: { start: number; end: number }) => ({
          ...seg,
          text: arabiziText,
        }));
      }
    }

    const srt = convertToSRT(segments);

    fs.unlinkSync(file.filepath);

    return res.status(200).json({ srt });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Maktub error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}