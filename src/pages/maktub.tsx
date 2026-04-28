import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Download, Upload } from "lucide-react";

export default function MaktubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [srtContent, setSrtContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setSrtContent("");
      setStatus("");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !language) return;

    setProcessing(true);
    setSrtContent("");
    setStatus("Uploading audio...");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language", language);

      setStatus("Transcribing audio...");

      const response = await fetch("/api/maktub", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.srt) {
        setSrtContent(data.srt);
        setStatus("Caption file ready!");
      } else if (data.error) {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setStatus("Error processing audio. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!srtContent) return;

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `captions_${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50">
        <div className="container py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Maktub.AI</h1>
          <p className="text-muted-foreground">Audio transcription and multilingual caption generator</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Audio File</CardTitle>
            <CardDescription>Upload an MP3 file and select your caption language/style</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio">Audio File (.mp3)</Label>
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="audio" 
                    className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {audioFile ? audioFile.name : "Choose file"}
                  </label>
                  <input
                    id="audio"
                    type="file"
                    accept=".mp3,audio/mpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Caption Language/Style</Label>
                <Select value={language} onValueChange={setLanguage} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="arabic">Arabic (Normal)</SelectItem>
                    <SelectItem value="fusha">Arabic Fusha (Formal)</SelectItem>
                    <SelectItem value="arabizi">Arabizi (Arabic in Latin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status && (
                <p className="text-sm text-muted-foreground">{status}</p>
              )}

              <Button type="submit" disabled={processing || !audioFile || !language}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate Captions"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {srtContent && (
          <Card>
            <CardHeader>
              <CardTitle>Caption File Ready</CardTitle>
              <CardDescription>Your SRT file is ready to download</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{srtContent}</pre>
              </div>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download .srt File
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}