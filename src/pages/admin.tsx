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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, UserPlus, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

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
        description: `${fullName} (${email}) has been added successfully.`,
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
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

  const handleToggleRole = async (userId: string, currentIsAdmin: boolean, userName: string) => {
    setUpdatingRoles(prev => new Set(prev).add(userId));
    
    const newRole = !currentIsAdmin;
    const result = await profileService.updateUserRole(userId, newRole);
    
    if (result.success) {
      toast({
        title: "Role updated",
        description: `${userName} is now ${newRole ? "an Admin" : "an Editor"}.`,
      });
      await loadUsers();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update role",
        variant: "destructive",
      });
    }

    setUpdatingRoles(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
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
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage users and access control</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User
            </CardTitle>
            <CardDescription>Add a new editor or admin to AG Edits</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="editor@agedits.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="isAdmin" className="cursor-pointer">
                  Grant admin access (can manage users)
                </Label>
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members ({users.length})</CardTitle>
            <CardDescription>View and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.is_admin ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleRole(
                          user.id, 
                          user.is_admin || false, 
                          user.full_name || user.email || "user"
                        )}
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Editor
                          </>
                        )}
                      </Badge>
                      {updatingRoles.has(user.id) && (
                        <span className="text-xs text-muted-foreground ml-2">Updating...</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(
                          user.id, 
                          user.full_name || user.email || "user"
                        )}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}