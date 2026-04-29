import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { generationService } from "@/services/generationService";
import { activityService } from "@/services/activityService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Download, Upload } from "lucide-react";

type CaptionTrack = "fusha" | "dialect" | "arabizi" | "english";

export default function MaktubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [selectedTracks, setSelectedTracks] = useState<CaptionTrack[]>([]);
  const [wordsPerCaption, setWordsPerCaption] = useState([6]);
  const [detectSpeakers, setDetectSpeakers] = useState(false);
  const [stripFillers, setStripFillers] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [srtFiles, setSrtFiles] = useState<Record<string, string>>({});
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
      const file = e.target.files[0];
      if (file.size > 60 * 1024 * 1024) {
        alert("File size must be under 60MB");
        return;
      }
      setAudioFile(file);
      setSrtFiles({});
      setStatus("");
    }
  };

  const toggleTrack = (track: CaptionTrack) => {
    setSelectedTracks(prev =>
      prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || selectedTracks.length === 0) return;

    setProcessing(true);
    setSrtFiles({});
    setStatus("Uploading audio...");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language", sourceLanguage);
      selectedTracks.forEach(track => {
        formData.append("tracks", track);
      });
      formData.append("wordsPerCaption", wordsPerCaption[0].toString());
      formData.append("detectSpeakers", detectSpeakers.toString());
      formData.append("stripFillers", stripFillers.toString());

      setStatus("Processing audio...");

      const response = await fetch("/api/maktub", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.results) {
        setSrtFiles(data.results);
        setStatus("Caption files ready!");
        
        // Save generation and log activity
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await generationService.saveGeneration(
            session.user.id,
            "Maktub.AI",
            { 
              fileName: audioFile.name, 
              language: sourceLanguage, 
              tracks: selectedTracks,
              wordsPerCaption: wordsPerCaption[0],
              detectSpeakers,
              stripFillers
            },
            data.results
          );
          await activityService.logActivity(session.user.id, "Generated captions", "Maktub.AI");
        }
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

  const handleDownload = (trackName: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle || "captions"}_${trackName}_${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const trackLabels: Record<CaptionTrack, string> = {
    fusha: "Arabic FUSHA (MSA)",
    dialect: "Arabic عامي (Dialect)",
    arabizi: "Arabizi (Latin)",
    english: "English (Translation)",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Maktub.AI</h1>
          <p className="text-muted-foreground mt-1">Multilingual caption generator with advanced controls</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Upload Audio & Configure</CardTitle>
            <CardDescription>Upload MP3 or WAV (max 60MB) and select caption tracks</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title</Label>
                <Input
                  id="projectTitle"
                  placeholder="My Video Project"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio">Audio File (MP3 or WAV)</Label>
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
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </div>
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Source Language</Label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Caption Tracks (select one or more)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(trackLabels) as CaptionTrack[]).map(track => (
                    <div
                      key={track}
                      onClick={() => toggleTrack(track)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTracks.includes(track)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${
                          selectedTracks.includes(track)
                            ? "bg-primary border-primary"
                            : "border-muted"
                        }`} />
                        <span className="font-medium">{trackLabels[track]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Words per Caption</Label>
                  <span className="text-sm text-muted-foreground">{wordsPerCaption[0]} words</span>
                </div>
                <Slider
                  value={wordsPerCaption}
                  onValueChange={setWordsPerCaption}
                  min={2}
                  max={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tight (2)</span>
                  <span>Balanced (6)</span>
                  <span>Loose (12)</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <Label htmlFor="detectSpeakers" className="cursor-pointer">
                    Detect Speakers (tag lines S1, S2...)
                  </Label>
                  <input
                    id="detectSpeakers"
                    type="checkbox"
                    checked={detectSpeakers}
                    onChange={(e) => setDetectSpeakers(e.target.checked)}
                    className="w-5 h-5 rounded border-input cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <Label htmlFor="stripFillers" className="cursor-pointer">
                    Strip filler words (يعني، um, uh, like...)
                  </Label>
                  <input
                    id="stripFillers"
                    type="checkbox"
                    checked={stripFillers}
                    onChange={(e) => setStripFillers(e.target.checked)}
                    className="w-5 h-5 rounded border-input cursor-pointer"
                  />
                </div>
              </div>

              {status && (
                <p className="text-sm text-muted-foreground">{status}</p>
              )}

              <Button type="submit" disabled={processing || !audioFile || selectedTracks.length === 0}>
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

        {Object.keys(srtFiles).length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Caption Files Ready</CardTitle>
              <CardDescription>Download your .srt files below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(srtFiles).map(([trackName, content]) => (
                <div key={trackName} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{trackLabels[trackName as CaptionTrack]}</p>
                    <p className="text-sm text-muted-foreground">
                      {content.split('\n\n').length - 1} captions
                    </p>
                  </div>
                  <Button onClick={() => handleDownload(trackName, content)} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}