"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="text-sm leading-relaxed space-y-3">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Inline code
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match;

                        return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground" {...props}>
                                {children}
                            </code>
                        ) : (
                            // Code blocks
                            <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-3">
                                <code className="text-sm font-mono text-foreground" {...props}>
                                    {children}
                                </code>
                            </pre>
                        );
                    },
                    // Paragraphs
                    p({ children }) {
                        return <p className="mb-3 last:mb-0">{children}</p>;
                    },
                    // Unordered lists
                    ul({ children }) {
                        return <ul className="list-disc list-inside space-y-1 mb-3 ml-2">{children}</ul>;
                    },
                    // Ordered lists
                    ol({ children }) {
                        return <ol className="list-decimal list-inside space-y-1 mb-3 ml-2">{children}</ol>;
                    },
                    // Bold text
                    strong({ children }) {
                        return <strong className="font-semibold text-foreground">{children}</strong>;
                    },
                    // Links
                    a({ children, href }) {
                        return (
                            <a href={href} className="text-primary underline underline-offset-4 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                                {children}
                            </a>
                        );
                    },
                    // Blockquotes
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-3">
                                {children}
                            </blockquote>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}