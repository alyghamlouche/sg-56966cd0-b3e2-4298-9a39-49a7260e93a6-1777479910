import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { chatService, type ChatMessage } from "@/services/chatService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";

export default function AIAssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthAndInitSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuthAndInitSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    const newSessionId = await chatService.createSession(session.user.id);
    if (newSessionId) {
      setSessionId(newSessionId);
    }

    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    await chatService.addMessage(sessionId, "user", userMessage);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        await chatService.addMessage(sessionId, "assistant", data.reply);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
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
      <div className="flex flex-col h-screen">
        <header className="border-b border-border/50 p-4">
          <div className="container">
            <h1 className="text-2xl font-display font-bold">AI Assistant</h1>
            <p className="text-muted-foreground">Your expert video editing co-pilot</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex-1 space-y-4 overflow-y-auto mb-4">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <h2 className="text-2xl font-display font-bold">AI Editing Co-Pilot</h2>
                <p className="text-muted-foreground">Ask me about editing ideas, pacing, style, or creative direction</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card className={`max-w-[80%] p-4 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card"
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-code:text-accent prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </Card>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <Card className="p-4 bg-card">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <form onSubmit={handleSend} className="border-t border-border/50 p-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about editing, pacing, style..."
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}