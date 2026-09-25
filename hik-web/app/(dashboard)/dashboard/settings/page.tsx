"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Key, MessageSquare, Plus, Trash2, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

interface ProviderKey {
    id: string;
    provider: string;
    createdAt: string;
    updatedAt: string;
}

interface UsageLog {
    id: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    createdAt: string;
}


export default function SettingsPage() {
    const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<ProviderKey | null>(null);
    const [newKeyProvider, setNewKeyProvider] = useState<"openai" | "anthropic">("openai");
    const [newKeyValue, setNewKeyValue] = useState("");
    const [saving, setSaving] = useState(false);

    const [usage, setUsage] = useState<{
        logs: UsageLog[];
        totals: { inputTokens: number; outputTokens: number; totalTokens: number };
        byProvider: Record<string, { inputTokens: number; outputTokens: number; requests: number }>;
    } | null>(null);

    useEffect(() => {
        loadProviderKeys();
        loadUsage();
    }, []);

    const loadProviderKeys = async () => {
        try {
            const response = await api.listProviderKeys();
            setProviderKeys(response.keys);
        } catch (error) {
            toast.error("Failed to load provider keys");
        } finally {
            setLoading(false);
        }
    };

    const loadUsage = async () => {
        try {
            const response = await api.getUsage();
            setUsage(response);
        } catch (error) {
            console.error("Failed to load usage");
        }
    };

    const handleSaveKey = async () => {
        if (!newKeyValue.trim()) {
            toast.error("Please enter an API key");
            return;
        }

        setSaving(true);
        try {
            await api.saveProviderKey(newKeyProvider, newKeyValue);
            toast.success(`${newKeyProvider} key saved successfully`);
            setNewKeyValue("");
            setAddKeyDialogOpen(false);
            await loadProviderKeys();
        } catch (error) {
            toast.error("Failed to save key");
        } finally {
            setSaving(false);
        }
    };


    const handleDeleteKey = async () => {
        if (!keyToDelete) return;

        try {
            await api.deleteProviderKey(keyToDelete.provider);
            toast.success(`${keyToDelete.provider} key deleted`);
            setDeleteDialogOpen(false);
            setKeyToDelete(null);
            await loadProviderKeys();
        } catch (error) {
            toast.error("Failed to delete key");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    // Prepare data for usage over time chart
    const prepareUsageOverTime = (logs: UsageLog[]) => {
        const dailyUsage: Record<string, { date: string; inputTokens: number; outputTokens: number }> = {};

        logs.forEach((log) => {
            const date = new Date(log.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });

            if (!dailyUsage[date]) {
                dailyUsage[date] = { date, inputTokens: 0, outputTokens: 0 };
            }

            dailyUsage[date].inputTokens += log.inputTokens;
            dailyUsage[date].outputTokens += log.outputTokens;
        });

        return Object.values(dailyUsage).reverse().slice(0, 14); // Last 14 days
    };

    // Prepare data for provider pie chart
    const prepareProviderData = (byProvider: Record<string, { inputTokens: number; outputTokens: number; requests: number }>) => {
        return Object.entries(byProvider).map(([provider, data]) => ({
            provider,
            tokens: data.inputTokens + data.outputTokens,
        }));
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your API keys and view usage statistics
                </p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="keys">Provider Keys</TabsTrigger>
                    <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="keys" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Bring Your Own Key (BYOK)</CardTitle>
                                    <CardDescription>
                                        Add your personal API keys to use with Hik
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setAddKeyDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Key
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : providerKeys.length === 0 ? (
                                <div className="text-center py-12">
                                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No provider keys configured</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add your OpenAI or Anthropic API key to start using Hik
                                    </p>
                                    <Button onClick={() => setAddKeyDialogOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Key
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {providerKeys.map((key) => (
                                        <div
                                            key={key.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Key className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium capitalize">{key.provider}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Last updated {formatDate(key.updatedAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setKeyToDelete(key);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="usage" className="space-y-6">
                    {usage && (
                        <>
                            {/* Usage Overview Cards */}
                            <div className="grid gap-6 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatNumber(usage.totals.totalTokens)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatNumber(usage.totals.inputTokens)} input /{" "}
                                            {formatNumber(usage.totals.outputTokens)} output
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Providers Used</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {Object.keys(usage.byProvider).length}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {Object.keys(usage.byProvider).join(", ") || "None"}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {Object.values(usage.byProvider).reduce(
                                                (sum, p) => sum + p.requests,
                                                0
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Across all providers
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 🆕 Token Usage Over Time Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Token Usage Over Time</CardTitle>
                                    <CardDescription>
                                        Daily token consumption across all providers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={prepareUsageOverTime(usage.logs)}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--popover))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "6px",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="inputTokens"
                                                stackId="1"
                                                stroke="hsl(var(--chart-1))"
                                                fill="hsl(var(--chart-1))"
                                                fillOpacity={0.6}
                                                name="Input Tokens"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="outputTokens"
                                                stackId="1"
                                                stroke="hsl(var(--chart-2))"
                                                fill="hsl(var(--chart-2))"
                                                fillOpacity={0.6}
                                                name="Output Tokens"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* 🆕 Provider Breakdown Chart */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Usage by Provider</CardTitle>
                                        <CardDescription>
                                            Token distribution across AI providers
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={prepareProviderData(usage.byProvider)}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ provider, percent }) =>
                                                        `${provider} ${(percent * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={80}
                                                    fill="hsl(var(--chart-1))"
                                                    dataKey="tokens"
                                                >
                                                    {prepareProviderData(usage.byProvider).map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Provider Breakdown</CardTitle>
                                        <CardDescription>
                                            Detailed usage statistics
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {Object.entries(usage.byProvider).map(([provider, data]) => (
                                                <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div>
                                                        <div className="font-medium capitalize">{provider}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {data.requests} requests
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {formatNumber(data.inputTokens + data.outputTokens)} tokens
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatNumber(data.inputTokens)} in / {formatNumber(data.outputTokens)} out
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Usage Logs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>
                                        Your last 20 chat interactions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {usage.logs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-center justify-between p-3 border rounded-lg text-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="capitalize">
                                                        {log.provider}
                                                    </Badge>
                                                    <span className="text-muted-foreground">{log.model}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-muted-foreground">
                                                        {formatNumber(log.inputTokens + log.outputTokens)} tokens
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(log.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Key Dialog */}
            <Dialog open={addKeyDialogOpen} onOpenChange={setAddKeyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Provider API Key</DialogTitle>
                        <DialogDescription>
                            Add your personal API key to use with Hik
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <select
                                value={newKeyProvider}
                                onChange={(e) => setNewKeyProvider(e.target.value as "openai" | "anthropic")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic">Anthropic</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder={newKeyProvider === "openai" ? "sk-..." : "sk-ant-..."}
                                value={newKeyValue}
                                onChange={(e) => setNewKeyValue(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your key is stored securely and used only for your requests
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddKeyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveKey} disabled={saving}>
                            {saving ? "Saving..." : "Save Key"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Provider Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete your {keyToDelete?.provider} key? You will need to re-add it to continue using that provider.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteKey}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}