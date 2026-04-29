import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="container py-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Edit Breakdown</h1>
          <p className="text-muted-foreground mt-1">Analyze video editing styles</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Analyze an Instagram Video</CardTitle>
            <CardDescription>Paste an Instagram video URL to get a detailed editing breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Instagram Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://www.instagram.com/reel/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Video"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {breakdown && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Breakdown Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose-apple prose max-w-none text-foreground">
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