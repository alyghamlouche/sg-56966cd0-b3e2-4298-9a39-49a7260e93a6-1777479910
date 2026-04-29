import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, GraduationCap, Captions, ImageIcon, Film, Users, MessageCircle, Bookmark } from "lucide-react";

const features = [
  {
    name: "AI Assistant",
    description: "AI-powered editing co-pilot",
    icon: MessageSquare,
    href: "/ai-assistant",
  },
  {
    name: "Effects Tutor",
    description: "Step-by-step tutorials",
    icon: GraduationCap,
    href: "/effects-tutor",
  },
  {
    name: "Maktub.AI",
    description: "Multilingual caption generator",
    icon: Captions,
    href: "/maktub",
  },
  {
    name: "Image Prompt",
    description: "Generate detailed prompts",
    icon: ImageIcon,
    href: "/image-prompt",
  },
  {
    name: "Edit Breakdown",
    description: "Analyze video editing styles",
    icon: Film,
    href: "/edit-breakdown",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    conversations: 0,
    savedItems: 0,
    actionsLogged: 0,
    teamSize: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    // Fetch team size
    const allProfiles = await profileService.getAllProfiles();
    setStats(prev => ({ ...prev, teamSize: allProfiles.length }));

    setLoading(false);
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
      <div className="container py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-semibold">Welcome back to AG Edits</h1>
          <p className="text-muted-foreground mt-1">Your video editing toolkit</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground">Total Conversations</CardDescription>
              <CardTitle className="text-3xl font-semibold">{stats.conversations}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground">Saved Items</CardDescription>
              <CardTitle className="text-3xl font-semibold">{stats.savedItems}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground">Actions Logged</CardDescription>
              <CardTitle className="text-3xl font-semibold">{stats.actionsLogged}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground">Team Size</CardDescription>
              <CardTitle className="text-3xl font-semibold">{stats.teamSize}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tools Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link key={feature.name} href={feature.href}>
                <Card className="border-border hover:border-foreground/20 transition-all h-full cursor-pointer group">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-foreground/10 transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{feature.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}