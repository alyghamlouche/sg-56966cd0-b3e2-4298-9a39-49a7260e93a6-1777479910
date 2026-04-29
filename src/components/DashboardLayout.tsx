import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  GraduationCap, 
  Captions, 
  ImageIcon, 
  Users,
  LogOut,
  Home,
  Menu,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log("Session check:", { session: !!session, userId: session?.user?.id });
    
    if (!session) {
      router.push("/login");
      return;
    }

    const profile = await profileService.getProfile(session.user.id);
    console.log("Profile fetched in DashboardLayout:", { 
      profile, 
      hasProfile: !!profile,
      isAdmin: profile?.is_admin,
      email: profile?.email
    });
    
    if (profile?.is_admin === true) {
      console.log("Setting isAdmin to TRUE");
      setIsAdmin(true);
    } else {
      console.log("isAdmin remains FALSE, profile?.is_admin =", profile?.is_admin);
      setIsAdmin(false);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/" },
    { name: "AI Assistant", icon: MessageSquare, href: "/ai-assistant" },
    { name: "Effects Tutor", icon: GraduationCap, href: "/effects-tutor" },
    { name: "Maktub.AI", icon: Captions, href: "/maktub" },
    { name: "Image Prompt", icon: ImageIcon, href: "/image-prompt" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-display font-bold text-primary">AG Edits</h1>
            <p className="text-sm text-muted-foreground mt-1">Creative Tools</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`
                    flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                    }
                  `}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}

            {/* Admin Section */}
            {(() => {
              console.log("Rendering admin section check:", { isAdmin });
              return isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t border-border">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Administration
                    </p>
                    <Link href="/admin">
                      <div className={`
                        flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer
                        ${router.pathname === "/admin"
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-foreground"
                        }
                      `}>
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Team Management</span>
                      </div>
                    </Link>
                  </div>
                </>
              );
            })()}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-0">
        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}