import { supabase } from "@/integrations/supabase/client";

export interface Generation {
  id: string;
  user_id: string;
  feature_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  created_at: string;
}

export const generationService = {
  async saveGeneration(
    userId: string,
    featureName: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>
  ): Promise<Generation | null> {
    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        feature_name: featureName,
        input,
        output,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving generation:", error);
      return null;
    }

    return data;
  },

  async getUserGenerations(userId: string): Promise<Generation[]> {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generations:", error);
      return [];
    }

    return data || [];
  },

  async getGenerationCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error counting generations:", error);
      return 0;
    }

    return count || 0;
  },
};