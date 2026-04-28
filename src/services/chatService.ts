import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
}

export const chatService = {
  async createSession(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return null;
    }

    return data.id;
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return (data || []).map(msg => {
      const message: ChatMessage = {
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        created_at: msg.created_at
      };
      return message;
    });
  },

  async addMessage(sessionId: string, role: "user" | "assistant" | "system", content: string): Promise<boolean> {
    const { error } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role, content });

    if (error) {
      console.error("Error adding message:", error);
      return false;
    }

    return true;
  },

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }

    return data || [];
  }
};