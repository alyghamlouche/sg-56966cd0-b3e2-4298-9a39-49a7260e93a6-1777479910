import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";

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
          <h1 className="text-3xl font-display font-bold">Image Prompt Generator</h1>
          <p className="text-muted-foreground">Generate detailed prompts for Midjourney & DALL·E</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Describe Your Image Concept</CardTitle>
            <CardDescription>Enter a basic idea and get a professional, detailed prompt</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="concept">Image Concept</Label>
                <Textarea
                  id="concept"
                  placeholder="e.g., futuristic cityscape at sunset, minimalist product photography, abstract watercolor portrait"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Detailed Prompt"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {prompt && (
          <Card>
            <CardHeader>
              <CardTitle>Your Professional Prompt</CardTitle>
              <CardDescription>Copy and use in Midjourney, DALL·E, or other AI image tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:font-semibold prose-p:leading-relaxed prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal prose-code:text-accent">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prompt}
                </ReactMarkdown>
              </div>
              <Button onClick={handleCopy} variant="outline">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}