"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import {
    MessageSquare,
    Zap,
    TrendingUp,
    Key,
    Calendar,
    ArrowRight,
    Bot,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface OverviewData {
    totalSessions: number;
    totalTokens: { input: number; output: number; total: number };
    totalRequests: number;
    activeProviders: string[];
    apiKeysCount: number;
    recentSessions: Array<{
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
    }>;
    user: {
        email: string;
        plan: string;
        createdAt: string;
    };
}

export default function OverviewPage() {
    const { user } = useAuth();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        try {
            const response = await api.getOverview();
            setData(response);
        } catch (error) {
            toast.error("Failed to load overview");
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    if (loading || !data) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground mt-1">
                    Here&apos;s what&apos;s happening with your Hik workspace
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(data.totalSessions)}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.totalSessions === 0 ? "Start your first chat" : "Conversations saved"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(data.totalTokens.total)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatNumber(data.totalTokens.input)} in / {formatNumber(data.totalTokens.output)} out
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.apiKeysCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.apiKeysCount === 0 ? "Generate your first key" : "Active keys"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeProviders.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.activeProviders.length > 0
                                ? data.activeProviders.join(", ")
                                : "No recent activity"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Sessions & Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Sessions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Sessions</CardTitle>
                            <Link href="/dashboard/sessions">
                                <Button variant="ghost" size="sm">
                                    View all
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                        <CardDescription>Your latest conversations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.recentSessions.length === 0 ? (
                            <div className="text-center py-8">
                                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    No conversations yet
                                </p>
                                <Link href="/dashboard/chat">
                                    <Button size="sm">Start Chatting</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.recentSessions.map((session) => (
                                    <Link key={session.id} href="/dashboard/sessions">
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {session.title || "Untitled Chat"}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(session.updatedAt)}
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Get started with Hik</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/dashboard/chat">
                            <Button variant="outline" className="w-full justify-start">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Start a new chat
                            </Button>
                        </Link>

                        {data.apiKeysCount === 0 && (
                            <Link href="/dashboard/api-keys">
                                <Button variant="outline" className="w-full justify-start">
                                    <Key className="h-4 w-4 mr-2" />
                                    Generate your first API key
                                </Button>
                            </Link>
                        )}

                        <Link href="/dashboard/settings">
                            <Button variant="outline" className="w-full justify-start">
                                <Zap className="h-4 w-4 mr-2" />
                                Add provider API keys
                            </Button>
                        </Link>

                        <Link href="/dashboard/sessions">
                            <Button variant="outline" className="w-full justify-start">
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View usage analytics
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Getting Started Guide (only show if new user) */}
            {data.totalSessions === 0 && data.apiKeysCount === 0 && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Set up your Hik workspace in 3 simple steps
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                                1
                            </div>
                            <div>
                                <h3 className="font-medium">Generate an API Key</h3>
                                <p className="text-sm text-muted-foreground">
                                    Go to{" "}
                                    <Link href="/dashboard/api-keys" className="text-primary hover:underline">
                                        API Keys
                                    </Link>{" "}
                                    and create a key for your Obsidian plugin, CLI, or other clients.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                                2
                            </div>
                            <div>
                                <h3 className="font-medium">Connect Your Clients</h3>
                                <p className="text-sm text-muted-foreground">
                                    Use the API key in Obsidian, CLI, or any other Hik client to start chatting.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                                3
                            </div>
                            <div>
                                <h3 className="font-medium">Sync Everywhere</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your sessions automatically sync across all platforms. Access your chat history anywhere.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}