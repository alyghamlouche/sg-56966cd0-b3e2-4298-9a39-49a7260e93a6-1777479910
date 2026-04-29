import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }

    return data || [];
  },

  async createUser(email: string, password: string, fullName: string, isAdmin: boolean = false): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_admin: isAdmin,
            full_name: fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            is_admin: isAdmin,
            full_name: fullName
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        return { success: true, userId: authData.user.id };
      }

      return { success: false, error: "User creation failed" };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error creating user:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  async updateUserRole(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: isAdmin })
        .eq("id", userId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating user role:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error deleting user:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }
};