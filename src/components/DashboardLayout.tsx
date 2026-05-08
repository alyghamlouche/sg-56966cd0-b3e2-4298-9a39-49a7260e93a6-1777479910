import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Captions, 
  Image as ImageIcon,
  Users,
  Settings,
  LogOut,
  Zap
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserEmail(session.user.email || null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/ai-assistant", icon: MessageSquare, label: "AI Assistant" },
    { href: "/effects-tutor", icon: Sparkles, label: "Effects Tutor" },
    { href: "/maktub", icon: Captions, label: "Maktub.AI" },
    { href: "/image-prompt", icon: ImageIcon, label: "Image Prompt" },
    { href: "/edit-breakdown", icon: Zap, label: "Edit Breakdown" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return router.pathname === "/";
    }
    return router.pathname === href;
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-thin border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-thin border-border">
          <h1 className="text-2xl font-display font-bold text-white">AG Edits</h1>
          <p className="text-xs text-[#777] mt-1">Video Editing Tools</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[#d4f55c14] text-[#d4f55c] border-[0.5px] border-[#d4f55c33]" 
                    : "text-[#777] hover:bg-[#d4f55c11] hover:text-[#d4f55c]"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-thin border-border space-y-1">
          <Link
            href="/team"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#ccc] hover:bg-card hover:text-white transition-all"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Team</span>
          </Link>
          
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#ccc] hover:bg-card hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>

          {userEmail && (
            <div className="px-4 py-2 mt-3">
              <p className="text-xs text-[#555] truncate">{userEmail}</p>
            </div>
          )}

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-[#ccc] hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}