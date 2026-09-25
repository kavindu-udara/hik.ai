"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId] = useState(uuidv4());

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !token) return;

        const userMessage: Message = { role: "user", content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Add a temporary empty assistant message for streaming
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            const response = await fetch("http://localhost:3000/api/v1/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sessionId,
                    messages: [...messages, userMessage],
                    model: "qwen2.5-coder-7b-instruct", // Or let user pick later
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to get response");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === "text") {
                                    assistantContent += data.content;
                                    // Update the last message with the streamed content
                                    setMessages((prev) => {
                                        const newMessages = [...prev];
                                        newMessages[newMessages.length - 1] = {
                                            role: "assistant",
                                            content: assistantContent,
                                        };
                                        return newMessages;
                                    });
                                }
                            } catch (e) {
                                // Ignore parse errors for incomplete chunks
                            }
                        }
                    }
                }
            }
        } catch (error) {
            toast.error((error as Error).message);
            // Remove the empty assistant message on error
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Web Chat</h1>
                <p className="text-sm text-muted-foreground">
                    Chat directly from your browser. Sessions sync with Obsidian & CLI.
                </p>
            </div>

            {/* Chat History */}
            <Card className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 bg-muted/30">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Bot className="h-12 w-12 mb-4 opacity-50" />
                        <p>Start a new conversation</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "assistant" && (
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border shadow-sm"
                                }`}
                        >
                            {msg.role === "assistant" ? (
                                msg.content ? (
                                    <MarkdownRenderer content={msg.content} />
                                ) : (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                )
                            ) : (
                                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                            )}
                        </div>

                        {msg.role === "user" && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </Card>

            {/* Input Area */}
            <div className="flex gap-2">
                <Textarea
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="min-h-[60px] resize-none"
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="h-[60px] px-6"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
}

