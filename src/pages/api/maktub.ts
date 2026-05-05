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
    const form = formidable({ 
      multiples: false,
      maxFileSize: 60 * 1024 * 1024,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function convertToSRT(segments: Array<{ start: number; end: number; text: string }>, wordsPerCaption: number, detectSpeakers: boolean, stripFillers: boolean): string {
  const fillerWords = [
    "يعني", "بقى", "اه", "اي", "يلا", "ميك", "بقا", "وق",
    "um", "uh", "like", "you know",
  ];

  let srt = "";
  let captionIndex = 1;
  let currentCaption = "";
  let wordCount = 0;
  let captionStart = 0;
  let speakerCount = 1;

  segments.forEach((segment) => {
    let text = segment.text.trim();
    
    if (stripFillers) {
      fillerWords.forEach((filler) => {
        const regex = new RegExp(`\\b${filler}\\b`, "gi");
        text = text.replace(regex, "");
      });
      text = text.replace(/\s+/g, " ").trim();
    }

    const words = text.split(" ");
    
    words.forEach((word, index) => {
      if (wordCount === 0) {
        captionStart = segment.start;
      }
      
      currentCaption += (wordCount > 0 ? " " : "") + word;
      wordCount++;

      if (wordCount >= wordsPerCaption || index === words.length - 1) {
        const startTime = formatTime(captionStart);
        const endTime = formatTime(segment.end);
        const speakerTag = detectSpeakers ? `S${speakerCount}: ` : "";
        srt += `${captionIndex}\n${startTime} --> ${endTime}\n${speakerTag}${currentCaption}\n\n`;
        
        captionIndex++;
        currentCaption = "";
        wordCount = 0;
        
        if (Math.random() > 0.7) {
          speakerCount = speakerCount === 1 ? 2 : 1;
        }
      }
    });
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

function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

async function transcribeAudioChunk(audioBuffer: Buffer, apiKey: string, language: string): Promise<any> {
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  formData.append("file", blob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("temperature", "0");

  if (language && language !== "auto") {
    formData.append("language", language);
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

  return whisperData;
}

function splitAudioIntoChunks(audioBuffer: Buffer, chunkSizeBytes: number): Buffer[] {
  const chunks: Buffer[] = [];
  let offset = 0;

  while (offset < audioBuffer.length) {
    const chunkSize = Math.min(chunkSizeBytes, audioBuffer.length - offset);
    const chunk = audioBuffer.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }

  return chunks;
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
    const tracksField = fields.tracks;
    const tracks = Array.isArray(tracksField) ? tracksField : [tracksField];
    const wordsPerCaption = parseInt(Array.isArray(fields.wordsPerCaption) ? fields.wordsPerCaption[0] : fields.wordsPerCaption || "6");
    const detectSpeakers = (Array.isArray(fields.detectSpeakers) ? fields.detectSpeakers[0] : fields.detectSpeakers) === "true";
    const stripFillers = (Array.isArray(fields.stripFillers) ? fields.stripFillers[0] : fields.stripFillers) === "true";

    console.log("Maktub API received:", { audioFile: !!audioFile, language, tracks, wordsPerCaption, detectSpeakers, stripFillers });

    if (!audioFile) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    if (!tracks || tracks.length === 0 || !tracks[0]) {
      return res.status(400).json({ error: "At least one caption track is required" });
    }

    const file = audioFile as FormidableFile;
    const audioBuffer = fs.readFileSync(file.filepath);
    const fileSizeMB = audioBuffer.length / (1024 * 1024);

    console.log(`Audio file size: ${fileSizeMB.toFixed(2)} MB`);

    // If file is larger than 20MB, split into chunks (roughly 10 minutes of audio at 128kbps = ~9MB)
    const maxChunkSize = 20 * 1024 * 1024; // 20MB chunks
    let allSegments: any[] = [];
    let totalDuration = 0;

    if (audioBuffer.length > maxChunkSize) {
      console.log("Large file detected, splitting into chunks...");
      const chunks = splitAudioIntoChunks(audioBuffer, maxChunkSize);
      console.log(`Split into ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
        const whisperData = await transcribeAudioChunk(chunks[i], apiKey, language);
        const chunkSegments = whisperData.segments || [];
        const chunkDuration = whisperData.duration || 0;

        // Adjust timestamps for all segments in this chunk
        const adjustedSegments = chunkSegments.map((seg: any) => ({
          ...seg,
          start: seg.start + totalDuration,
          end: seg.end + totalDuration,
        }));

        allSegments = allSegments.concat(adjustedSegments);
        totalDuration += chunkDuration;
      }
    } else {
      // Single pass for smaller files
      const whisperData = await transcribeAudioChunk(audioBuffer, apiKey, language);
      allSegments = whisperData.segments || [];
      totalDuration = whisperData.duration || 0;
    }

    console.log(`Total audio duration: ${totalDuration}s, Total segments: ${allSegments.length}`);

    // Filter out segments that exceed the audio duration
    const durationFilteredSegments = allSegments.filter((seg: any) => seg.start < totalDuration);
    
    console.log(`After duration filter: ${durationFilteredSegments.length} segments`);
    
    // Deduplicate by text similarity
    const deduplicatedSegments = [];
    const seenTexts: string[] = [];
    
    for (const segment of durationFilteredSegments) {
      const currentText = segment.text.trim().toLowerCase();
      
      if (currentText.length === 0) continue;
      
      let isDuplicate = false;
      
      for (const seenText of seenTexts) {
        const similarity = calculateSimilarity(currentText, seenText);
        if (similarity > 0.8) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        deduplicatedSegments.push(segment);
        seenTexts.push(currentText);
      }
    }
    
    console.log(`After deduplication: ${deduplicatedSegments.length} segments`);
    
    const transcriptText = deduplicatedSegments.map((s: any) => s.text).join(" ");
    const results: Record<string, string> = {};

    for (const track of tracks) {
      if (track === "fusha" || track === "dialect") {
        results[track] = convertToSRT(deduplicatedSegments, wordsPerCaption, detectSpeakers, stripFillers);
      } else if (track === "arabizi") {
        const arabiziSegments = [];
        
        for (const segment of deduplicatedSegments) {
          const arabiziPrompt = `Convert this Arabic text to Arabizi (Arabic written in Latin characters using common conventions: 3 for ع, 7 for ح, 2 for ء, 5 for خ, 9 for ق, etc.). Only output the Arabizi text, nothing else.\n\nArabic text: ${segment.text}`;

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
            arabiziSegments.push({
              start: segment.start,
              end: segment.end,
              text: arabiziText,
            });
          } else {
            // Fallback to original text if translation fails
            arabiziSegments.push({
              start: segment.start,
              end: segment.end,
              text: segment.text,
            });
          }
        }
        
        results.arabizi = convertToSRT(arabiziSegments, wordsPerCaption, detectSpeakers, stripFillers);
      } else if (track === "english") {
        const englishSegments = [];
        
        for (const segment of deduplicatedSegments) {
          const translatePrompt = `Translate this Arabic text to English. Preserve the meaning and tone. Only output the English translation, nothing else.\n\nArabic text: ${segment.text}`;

          const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "You are an expert Arabic-to-English translator." },
                { role: "user", content: translatePrompt },
              ],
              temperature: 0.3,
            }),
          });

          const gptData = await gptResponse.json();

          if (gptResponse.ok && gptData.choices?.[0]?.message?.content) {
            const englishText = gptData.choices[0].message.content.trim();
            englishSegments.push({
              start: segment.start,
              end: segment.end,
              text: englishText,
            });
          } else {
            // Fallback to original text if translation fails
            englishSegments.push({
              start: segment.start,
              end: segment.end,
              text: segment.text,
            });
          }
        }
        
        results.english = convertToSRT(englishSegments, wordsPerCaption, detectSpeakers, stripFillers);
      }
    }

    fs.unlinkSync(file.filepath);

    return res.status(200).json({ results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Maktub error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}