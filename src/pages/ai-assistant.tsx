import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { chatService, type ChatMessage } from "@/services/chatService";
import { activityService } from "@/services/activityService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";

export default function AIAssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [processing, setProcessing] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || processing) return;

    const userMessage = input.trim();
    setInput("");
    setProcessing(true);

    // Append user message to messages array
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      // Send entire conversation history to API
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage = { role: 'assistant' as const, content: data.response };
        // Append assistant response to messages array
        setMessages(prev => [...prev, assistantMessage]);
        setChatHistory(prev => [...prev, { role: "assistant", content: data.response }]);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session && sessionId) {
          await chatService.addMessage(sessionId, 'user', userMessage);
          await chatService.addMessage(sessionId, 'assistant', data.response);
        }
      } else if (data.error) {
        setChatHistory(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      console.error("Error:", error);
      setChatHistory(prev => [...prev, { role: "assistant", content: "Error processing request. Please try again." }]);
    } finally {
      setProcessing(false);
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
        <header className="border-b border-border p-6">
          <div className="container">
            <h1 className="text-2xl font-semibold">AI Assistant</h1>
            <p className="text-muted-foreground mt-1">Your expert video editing co-pilot</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="container max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <h2 className="text-2xl font-semibold">AI Editing Co-Pilot</h2>
                <p className="text-muted-foreground">Ask me about editing ideas, pacing, style, or creative direction</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card className={`max-w-[85%] p-5 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border-border text-foreground"
                }`}>
                  <div className="prose-apple prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </Card>
              </div>
            ))}

            {processing && (
              <div className="flex justify-start">
                <Card className="p-5 bg-card border-border text-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="border-t border-border p-6">
          <form onSubmit={handleSubmit} className="container max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about editing, pacing, style..."
                disabled={processing}
                className="flex-1"
              />
              <Button type="submit" disabled={processing || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </footer>
      </div>
    </DashboardLayout>
  );
}