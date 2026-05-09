import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { activityService } from "@/services/activityService";
import { generationService } from "@/services/generationService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Captions, Image as ImageIcon, TrendingUp, Clock, Zap, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGenerations: 0,
    thisWeek: 0,
    mostUsed: "—",
  });

  useEffect(() => {
    checkAuthAndLoadStats();
  }, []);

  const checkAuthAndLoadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    // Load user stats (profile data fetched lazily only when displaying stats)
    const generations = await generationService.getUserGenerations(session.user.id);
    const activities = await activityService.getUserActivity(session.user.id, 100);

    const total = generations.length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = activities.filter(a => new Date(a.created_at) > weekAgo).length;

    // Find most used tool
    const toolCounts: Record<string, number> = {};
    activities.forEach(a => {
      toolCounts[a.feature] = (toolCounts[a.feature] || 0) + 1;
    });
    const mostUsed = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    setStats({ totalGenerations: total, thisWeek, mostUsed });
    setLoading(false);
  };

  const tools = [
    {
      href: "/ai-assistant",
      icon: MessageSquare,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      title: "AI Assistant",
      description: "Chat with an expert video editing co-pilot",
    },
    {
      href: "/effects-tutor",
      icon: Sparkles,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
      title: "Effects Tutor",
      description: "Learn any effect with step-by-step tutorials",
    },
    {
      href: "/maktub",
      icon: Captions,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: "Maktub.AI",
      description: "Multilingual caption generator with translation",
    },
    {
      href: "/image-prompt",
      icon: ImageIcon,
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-500",
      title: "Image Prompt",
      description: "Generate detailed prompts for AI image tools",
    },
    {
      href: "/edit-breakdown",
      icon: Zap,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      title: "Edit Breakdown",
      description: "Analyze and break down video editing techniques",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-[#777] mt-2">Welcome back to AG Edits</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-thin border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs uppercase tracking-wider text-[#777] font-medium">Total Generations</p>
              </div>
              <p className="text-4xl font-display font-bold text-white">{stats.totalGenerations}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-thin border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs uppercase tracking-wider text-[#777] font-medium">This Week</p>
              </div>
              <p className="text-4xl font-display font-bold text-white">{stats.thisWeek}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-thin border-border rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-xs uppercase tracking-wider text-[#777] font-medium">Most Used</p>
              </div>
              <p className="text-2xl font-display font-bold text-white truncate">{stats.mostUsed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tools Section */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-6">Your Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              
              return (
                <Link key={tool.href} href={tool.href}>
                  <Card className="bg-card border-thin border-border rounded-xl hover:border-[#d4f55c22] transition-all group cursor-pointer h-full">
                    <CardHeader className="pb-4">
                      <div className={`w-14 h-14 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${tool.iconColor}`} />
                      </div>
                      <CardTitle className="text-white group-hover:text-primary transition-colors">{tool.title}</CardTitle>
                      <CardDescription className="text-[#777]">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full justify-between text-[#ccc] group-hover:text-primary group-hover:bg-primary/5">
                        Open Tool
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}