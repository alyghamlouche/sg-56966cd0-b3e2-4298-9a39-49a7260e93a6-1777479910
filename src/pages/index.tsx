import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, GraduationCap, Captions, ImageIcon } from "lucide-react";

const features = [
  {
    name: "AI Assistant",
    description: "AI-powered editing co-pilot for creative direction",
    icon: MessageSquare,
    href: "/ai-assistant",
  },
  {
    name: "Effects Tutor",
    description: "Step-by-step tutorials for Premiere Pro & After Effects",
    icon: GraduationCap,
    href: "/effects-tutor",
  },
  {
    name: "Maktub.AI",
    description: "Audio transcription and multilingual caption generator",
    icon: Captions,
    href: "/maktub",
  },
  {
    name: "Image Prompt Generator",
    description: "Generate detailed prompts for Midjourney & DALL·E",
    icon: ImageIcon,
    href: "/image-prompt",
  },
];

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-bold">Welcome to AG Edits</h2>
            <p className="text-muted-foreground text-lg">Choose a tool to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Link key={feature.name} href={feature.href}>
                <Card className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 h-full cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display">{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full group-hover:border-primary/50">
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}