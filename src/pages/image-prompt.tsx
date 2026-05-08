import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { generationService } from "@/services/generationService";
import { activityService } from "@/services/activityService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Check } from "lucide-react";

export default function ImagePromptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [concept, setConcept] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setGenerating(true);
    setPrompt("");
    setCopied(false);

    try {
      const response = await fetch("/api/image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept }),
      });

      const data = await response.json();

      if (data.prompt) {
        setPrompt(data.prompt);
        
        // Save generation and log activity
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await generationService.saveGeneration(
            session.user.id,
            "Image Prompt",
            { concept },
            data.prompt
          );
          await activityService.logActivity(session.user.id, "Generated image prompt", "Image Prompt");
        }
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      setPrompt("Error generating prompt. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="text-3xl font-display font-bold text-white">Image Prompt Generator</h1>
          <p className="text-[#777] mt-1">Generate detailed prompts for Midjourney, DALL·E, and more</p>
        </div>

        <Card className="bg-card border-thin border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Describe your image</CardTitle>
            <CardDescription className="text-[#777]">Brief description of the image you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="concept" className="text-[#ccc]">Image Concept</Label>
                <Textarea
                  id="concept"
                  placeholder="e.g. a futuristic cityscape at sunset, cinematic lighting..."
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  rows={4}
                  className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl resize-none"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={generating || !concept.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-11"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Prompt...
                  </>
                ) : (
                  "Generate Detailed Prompt"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {generatedPrompt && (
          <Card className="bg-card border-thin border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Generated Prompt</CardTitle>
              <CardDescription className="text-[#777]">Copy and use in your AI image tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-input border-thin border-border rounded-xl p-4">
                <p className="text-[#ccc] leading-relaxed whitespace-pre-wrap">{generatedPrompt}</p>
              </div>
              <Button 
                onClick={handleCopy}
                variant="outline"
                className="w-full border-thin border-border hover:bg-card hover:text-white rounded-xl"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy Prompt"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}