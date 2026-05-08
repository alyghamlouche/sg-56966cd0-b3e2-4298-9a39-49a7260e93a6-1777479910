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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AIAssistantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");
    const [chatHistory, setChatHistory] = useState < Array < { role: string; content: string } >> ([]);
    const [messages, setMessages] = useState < Array < { role: 'user' | 'assistant'; content: string } >> ([]);
    const [processing, setProcessing] = useState(false);
    const [sessionId, setSessionId] = useState < string | null > (null);
    const messagesEndRef = useRef < HTMLDivElement > (null);

    // Prompt builder state
    const [showPromptBuilder, setShowPromptBuilder] = useState(false);
    const [contentType, setContentType] = useState("Instagram Reel");
    const [videoAbout, setVideoAbout] = useState("");
    const [problemType, setProblemType] = useState("Video structure");
    const [extraContext, setExtraContext] = useState("");

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

        const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(updatedMessages);
        setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);

        try {
            const response = await fetch("/api/ai-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            const data = await response.json();

            if (data.response) {
                const assistantMessage = { role: 'assistant' as const, content: data.response };
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

    const buildPrompt = () => {
        const parts = [];

        if (contentType && videoAbout) {
            parts.push(`I am editing a ${contentType} about ${videoAbout}.`);
        } else if (contentType) {
            parts.push(`I am editing a ${contentType}.`);
        }

        if (problemType) {
            parts.push(`My problem is ${problemType}.`);
        }

        if (extraContext) {
            parts.push(`Additional context: ${extraContext}.`);
        }

        parts.push("Please give me specific, actionable advice tailored to Premiere Pro and short-form social content.");

        const builtPrompt = parts.join(" ");
        setInput(builtPrompt);
        setShowPromptBuilder(false);
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
                <header className="border-b border-thin border-border p-6 bg-sidebar">
                    <div className="container">
                        <h1 className="text-2xl font-display font-semibold text-white">AI Assistant</h1>
                        <p className="text-[#777] mt-1">Your expert video editing co-pilot</p>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-background">
                    <div className="container max-w-4xl mx-auto space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center py-16 space-y-3">
                                <h2 className="text-2xl font-display font-semibold text-white">AI Editing Co-Pilot</h2>
                                <p className="text-[#777]">Ask me about editing ideas, pacing, style, or creative direction</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <Card className={`max-w-[85%] p-5 rounded-xl ${msg.role === "user"
                                        ? "bg-primary text-white border-primary"
                                        : "bg-card border-thin border-border text-white"
                                    }`}>
                                    <div className="prose prose-sm max-w-none prose-invert prose-headings:text-white prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-[#ccc] prose-p:leading-relaxed prose-strong:text-white prose-strong:font-semibold prose-ul:text-[#ccc] prose-ol:text-[#ccc] prose-li:text-[#ccc] prose-li:my-1 prose-code:bg-[#1a1a1a] prose-code:text-[#d4f55c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-hr:border-[#2a2a2a]">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </Card>
                            </div>
                        ))}

                        {processing && (
                            <div className="flex justify-start">
                                <Card className="p-5 bg-card border-thin border-border rounded-xl">
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                </Card>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                <footer className="border-t border-thin border-border p-6 bg-sidebar">
                    <div className="container max-w-4xl mx-auto space-y-4">
                        {/* Prompt Builder Toggle */}
                        <Button
                            onClick={() => setShowPromptBuilder(!showPromptBuilder)}
                            variant="outline"
                            className="w-full border-thin border-border hover:bg-card hover:text-white rounded-xl text-[#ccc]"
                        >
                            {showPromptBuilder ? "Hide" : "Build your prompt"}
                        </Button>

                        {/* Prompt Builder Panel */}
                        {showPromptBuilder && (
                            <Card className="bg-card border-thin border-border rounded-xl p-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#ccc] text-sm">Content Type</Label>
                                            <Select value={contentType} onValueChange={setContentType}>
                                                <SelectTrigger className="bg-input border-thin border-border text-white rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-thin border-border">
                                                    <SelectItem value="Instagram Reel" className="text-white">Instagram Reel</SelectItem>
                                                    <SelectItem value="TikTok" className="text-white">TikTok</SelectItem>
                                                    <SelectItem value="YouTube Short" className="text-white">YouTube Short</SelectItem>
                                                    <SelectItem value="Corporate Video" className="text-white">Corporate Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#ccc] text-sm">What is the video about?</Label>
                                            <Input
                                                value={videoAbout}
                                                onChange={(e) => setVideoAbout(e.target.value)}
                                                placeholder="e.g. fitness tips, product review..."
                                                className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#ccc] text-sm">Problem Type</Label>
                                        <Select value={problemType} onValueChange={setProblemType}>
                                            <SelectTrigger className="bg-input border-thin border-border text-white rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-thin border-border">
                                                <SelectItem value="Video structure" className="text-white">Video structure</SelectItem>
                                                <SelectItem value="Specific effect in Premiere" className="text-white">Specific effect in Premiere</SelectItem>
                                                <SelectItem value="Pacing issue" className="text-white">Pacing issue</SelectItem>
                                                <SelectItem value="Hook ideas" className="text-white">Hook ideas</SelectItem>
                                                <SelectItem value="Color grade direction" className="text-white">Color grade direction</SelectItem>
                                                <SelectItem value="Audio/music" className="text-white">Audio/music</SelectItem>
                                                <SelectItem value="I don't know what to do" className="text-white">I don&apos;t know what to do</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#ccc] text-sm">Any extra context?</Label>
                                        <Input
                                            value={extraContext}
                                            onChange={(e) => setExtraContext(e.target.value)}
                                            placeholder="e.g. 60 second clip, no hook yet, Lebanese audience"
                                            className="bg-input border-thin border-border text-white placeholder:text-[#555] rounded-lg"
                                        />
                                    </div>

                                    <Button
                                        onClick={buildPrompt}
                                        className="w-full bg-[#d4f55c] hover:bg-[#deff6e] text-[#0a0a0a] font-medium rounded-[10px] transition-all hover:scale-[1.02]"
                                    >
                                        Build prompt
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Chat Input */}
                        <form onSubmit={handleSubmit}>
                            <div className="flex gap-3">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onInput={(e) => {
                                        const element = e.target as HTMLTextAreaElement;
                                        element.style.height = 'auto';
                                        element.style.height = element.scrollHeight + 'px';
                                    }}
                                    placeholder="Ask about editing, pacing, style..."
                                    disabled={processing}
                                    className="flex-1 bg-input border-thin border-border text-white placeholder:text-[#555] rounded-xl px-4 py-3"
                                    style={{
                                        resize: 'none',
                                        overflowY: 'auto',
                                        minHeight: '44px',
                                        maxHeight: '200px',
                                        width: '100%'
                                    }}
                                />
                                <Button type="submit" disabled={processing || !input.trim()} className="bg-[#d4f55c] hover:bg-[#deff6e] text-[#0a0a0a] font-medium rounded-[10px] transition-all hover:scale-[1.02]">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </footer>
            </div>
        </DashboardLayout>
    );
}