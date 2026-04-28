import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

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
          <h1 className="text-3xl font-display font-bold">Effects Tutor</h1>
          <p className="text-muted-foreground">Learn step-by-step how to create any effect</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What do you want to learn?</CardTitle>
            <CardDescription>Describe the effect and select your software</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="effect">Effect Description</Label>
                <Input
                  id="effect"
                  placeholder="e.g., cinematic color grading, smooth zoom transition"
                  value={effect}
                  onChange={(e) => setEffect(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Software</Label>
                  <Select value={software} onValueChange={setSoftware} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select software" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premiere">Adobe Premiere Pro</SelectItem>
                      <SelectItem value="aftereffects">After Effects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Tutorial"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {tutorial && (
          <Card>
            <CardHeader>
              <CardTitle>Tutorial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{tutorial}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}