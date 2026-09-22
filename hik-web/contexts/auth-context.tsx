"use client"
import { api, User } from "@/lib/api";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("hik_token");
        const savedUser = localStorage.getItem("hik_user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                localStorage.removeItem("hik_user");
            }
        }
        setIsLoading(false);
    }, []);


    const login = async (email: string, password: string) => {
        const response = await api.login(email, password);
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("hik_token", response.token);
        localStorage.setItem("hik_user", JSON.stringify(response.user));
    };

    const register = async (email: string, password: string) => {
        const response = await api.register(email, password);
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("hik_token", response.token);
        localStorage.setItem("hik_user", JSON.stringify(response.user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("hik_token");
        localStorage.removeItem("hik_user");
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
