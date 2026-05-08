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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function EffectsTutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [effect, setEffect] = useState("");
  const [software, setSoftware] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tutorial, setTutorial] = useState("");
  const [generating, setGenerating] = useState(false);

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
    if (!effect.trim() || !software || !difficulty) return;

    setGenerating(true);
    setTutorial("");

    try {
      const response = await fetch("/api/effects-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effect, software, difficulty }),
      });

      const data = await response.json();

      if (data.tutorial) {
        setTutorial(data.tutorial);
        
        // Save generation and log activity
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await generationService.saveGeneration(
            session.user.id,
            "Effects Tutor",
            { effect, software, difficulty },
            data.tutorial
          );
          await activityService.logActivity(session.user.id, "Generated tutorial", "Effects Tutor");
        }
      }
    } catch (error) {
      console.error("Error generating tutorial:", error);
      setTutorial("Error generating tutorial. Please try again.");
    } finally {
      setGenerating(false);
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
          <h1 className="text-3xl font-display font-bold text-white">Effects Tutor</h1>
          <p className="text-[#777] mt-1">Learn any effect with step-by-step tutorials</p>
        </div>

        <Card className="bg-card border-thin border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">What do you want to learn?</CardTitle>
            <CardDescription className="text-[#777]">Describe the effect, select your software and difficulty</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="effect" className="text-[#ccc]">Effect Description</Label>
                <Input
                  id="effect"
                  placeholder="e.g. smooth zoom transition, glitch effect, color grading..."
                  value={effect}
                  onChange={(e) => setEffect(e.target.value)}
                  className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#ccc]">Software</Label>
                  <Select value={software} onValueChange={setSoftware}>
                    <SelectTrigger className="bg-input border-thin border-border text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-thin border-border">
                      <SelectItem value="premiere" className="text-white">Adobe Premiere Pro</SelectItem>
                      <SelectItem value="aftereffects" className="text-white">After Effects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#ccc]">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-input border-thin border-border text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-thin border-border">
                      <SelectItem value="beginner" className="text-white">Beginner</SelectItem>
                      <SelectItem value="intermediate" className="text-white">Intermediate</SelectItem>
                      <SelectItem value="advanced" className="text-white">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={generating || !effect.trim()}
                className="w-full bg-[#d4f55c] hover:bg-[#deff6e] text-[#0a0a0a] font-medium rounded-[10px] h-11 transition-all hover:scale-[1.02]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Tutorial...
                  </>
                ) : (
                  "Generate Tutorial"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {tutorial && (
          <Card className="bg-card border-thin border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Tutorial</CardTitle>
              <CardDescription className="text-[#777]">{effect} in {software === "premiere" ? "Premiere Pro" : "After Effects"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-[#ccc] prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-ul:text-[#ccc] prose-ol:text-[#ccc] prose-li:text-[#ccc] prose-li:my-1 prose-code:bg-[#1a1a1a] prose-code:text-[#d4f55c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-hr:border-[#2a2a2a]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {tutorial}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}