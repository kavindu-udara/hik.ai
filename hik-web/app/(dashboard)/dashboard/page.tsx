"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, TrendingUp } from "lucide-react";

export default function OverviewPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to your Hik dashboard
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>
                        Set up your Hik workspace in 3 simple steps
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            1
                        </div>
                        <div>
                            <h3 className="font-medium">Generate an API Key</h3>
                            <p className="text-sm text-muted-foreground">
                                Go to <a href="/dashboard/api-keys" className="text-primary hover:underline">API Keys</a> and create a key for your clients.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            2
                        </div>
                        <div>
                            <h3 className="font-medium">Connect Your Clients</h3>
                            <p className="text-sm text-muted-foreground">
                                Use the API key in Obsidian, CLI, or any other Hik client.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            3
                        </div>
                        <div>
                            <h3 className="font-medium">Start Chatting</h3>
                            <p className="text-sm text-muted-foreground">
                                Your sessions sync across all platforms automatically.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}