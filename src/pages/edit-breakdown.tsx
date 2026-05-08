import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { generationService } from "@/services/generationService";
import { activityService } from "@/services/activityService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function EditBreakdownPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [breakdown, setBreakdown] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setAnalyzing(true);
    setBreakdown("");

    try {
      const response = await fetch("/api/edit-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();

      if (data.breakdown) {
        setBreakdown(data.breakdown);
        
        // Save generation and log activity
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await generationService.saveGeneration(
            session.user.id,
            "Edit Breakdown",
            { videoUrl },
            data.breakdown
          );
          await activityService.logActivity(session.user.id, "Analyzed video", "Edit Breakdown");
        }
      } else if (data.error) {
        setBreakdown(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error analyzing video:", error);
      setBreakdown("Error analyzing video. Please try again.");
    } finally {
      setAnalyzing(false);
    }
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
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Edit Breakdown</h1>
          <p className="text-[#777] mt-1">Analyze and break down video editing techniques</p>
        </div>

        <Card className="bg-card border-thin border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Describe the edit</CardTitle>
            <CardDescription className="text-[#777]">Paste a video URL or describe the editing style you want analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="editInput" className="text-[#ccc]">Video URL or Edit Description</Label>
                <Textarea
                  id="editInput"
                  placeholder="e.g. YouTube URL, describe a music video edit, commercial pacing..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  rows={4}
                  className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl resize-none"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={analyzing || !videoUrl.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Edit...
                  </>
                ) : (
                  "Analyze Edit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {breakdown && (
          <Card className="bg-card border-thin border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Edit Breakdown</CardTitle>
              <CardDescription className="text-[#777]">Analysis of techniques and structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-[#ccc] prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-ul:text-[#ccc] prose-ol:text-[#ccc] prose-li:text-[#ccc] prose-li:my-1 prose-code:bg-[#1a1a1a] prose-code:text-[#d4f55c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-hr:border-[#2a2a2a]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {breakdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}