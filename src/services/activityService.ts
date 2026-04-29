import { supabase } from "@/integrations/supabase/client";

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  feature: string;
  created_at: string;
}

export const activityService = {
  async logActivity(
    userId: string,
    action: string,
    feature: string
  ): Promise<Activity | null> {
    const { data, error } = await supabase
      .from("activity_log")
      .insert({
        user_id: userId,
        action,
        feature,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error);
      return null;
    }

    return data;
  },

  async getUserActivity(userId: string, limit = 5): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity:", error);
      return [];
    }

    return data || [];
  },

  async getActivityCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error counting activity:", error);
      return 0;
    }

    return count || 0;
  },
};