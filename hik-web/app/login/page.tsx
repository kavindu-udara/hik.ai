"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegister) {
                await register(email, password);
            } else {
                await login(email, password);
            }
            router.push("/dashboard");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <Bot className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Welcome to Hik</CardTitle>
                    <CardDescription>
                        {isRegister ? "Create your account" : "Sign in to your account"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
                        >
                            {isRegister
                                ? "Already have an account? Sign in"
                                : "Don't have an account? Register"}
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
