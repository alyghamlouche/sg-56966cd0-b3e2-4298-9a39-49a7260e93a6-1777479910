import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { profileService, type Profile } from "@/services/profileService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User } from "lucide-react";

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  const checkAuthAndLoadUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    const allUsers = await profileService.getAllProfiles();
    setUsers(allUsers);
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
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Team</h1>
          <p className="text-[#777] mt-1">Manage your team members and permissions</p>
        </div>

        <Card className="bg-card border-thin border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Team Members</CardTitle>
            <CardDescription className="text-[#777]">{users.length} members in your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-input border-thin border-border rounded-xl hover:bg-card transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{member.full_name || member.email}</p>
                      <p className="text-sm text-[#777]">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      member.is_admin ? "bg-primary/10 text-primary" : "bg-card text-[#ccc] border-thin border-border"
                    }`}>
                      {member.is_admin ? "Admin" : "Editor"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}