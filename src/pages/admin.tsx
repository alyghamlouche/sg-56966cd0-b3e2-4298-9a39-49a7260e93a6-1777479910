import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { profileService, type Profile } from "@/services/profileService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    const profile = await profileService.getProfile(session.user.id);
    if (!profile?.is_admin) {
      router.push("/");
      return;
    }

    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
    const allUsers = await profileService.getAllProfiles();
    setUsers(allUsers);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const result = await profileService.createUser(email, password, fullName, isAdmin);
    
    if (result.success) {
      toast({
        title: "User created",
        description: `${fullName || email} has been added successfully.`,
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      setShowAddUser(false);
      await loadUsers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create user",
        variant: "destructive",
      });
    }

    setCreating(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete user ${userName}? This action cannot be undone.`)) return;

    const result = await profileService.deleteUser(userId);
    
    if (result.success) {
      toast({
        title: "User deleted",
        description: `${userName} has been removed.`,
      });
      await loadUsers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete user",
        variant: "destructive",
      });
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
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Admin Panel</h1>
            <p className="text-[#777] mt-1">Manage users and system settings</p>
          </div>
          <Button onClick={() => setShowAddUser(!showAddUser)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {showAddUser && (
          <Card className="bg-card border-thin border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Add New User</CardTitle>
              <CardDescription className="text-[#777]">Create a new user account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#ccc]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#ccc]">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-[#ccc]">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-[#ccc]">Role</Label>
                    <Select value={isAdmin ? "admin" : "editor"} onValueChange={(value) => setIsAdmin(value === "admin")}>
                      <SelectTrigger className="bg-input border-thin border-border text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-thin border-border">
                        <SelectItem value="editor" className="text-white">Editor</SelectItem>
                        <SelectItem value="admin" className="text-white">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-thin border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
            <CardDescription className="text-[#777]">{users.length} total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-[#ccc]">Email</TableHead>
                    <TableHead className="text-[#ccc]">Full Name</TableHead>
                    <TableHead className="text-[#ccc]">Role</TableHead>
                    <TableHead className="text-[#ccc]">Created</TableHead>
                    <TableHead className="text-[#ccc] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-b border-border hover:bg-input/50">
                      <TableCell className="text-white">{user.email}</TableCell>
                      <TableCell className="text-[#ccc]">{user.full_name || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_admin ? "bg-primary/10 text-primary" : "bg-input text-[#ccc]"
                        }`}>
                          {user.is_admin ? "Admin" : "Editor"}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#777]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.full_name || user.email || "Unknown")}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}