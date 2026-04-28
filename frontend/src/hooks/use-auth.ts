"use client";

import { useEffect, useState } from "react";

interface User {
    id: string;
    role: string;
    [key: string]: any;
}

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function decodeJwtPayload(token: string): User | null {
    try {
        const part = token.split(".")[1];
        if (!part) return null;
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        return JSON.parse(atob(padded)) as User;
    } catch {
        return null;
    }
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncAuth = () => {
            const accessToken = readCookie("tatvivah_access");
            const roleCookie = readCookie("tatvivah_role");
            const userCookie = readCookie("tatvivah_user");

            setToken(accessToken);

            if (!accessToken) {
                setUser(null);
                setLoading(false);
                return;
            }

            if (userCookie) {
                try {
                    setUser(JSON.parse(userCookie) as User);
                    setLoading(false);
                    return;
                } catch {
                    // Fall through to JWT decode.
                }
            }

            const decoded = decodeJwtPayload(accessToken);
            if (decoded) {
                setUser(decoded);
            } else if (roleCookie) {
                setUser({ id: "", role: roleCookie } as User);
            } else {
                setUser(null);
            }

            setLoading(false);
        };

        syncAuth();

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                syncAuth();
            }
        };

        window.addEventListener("tatvivah-auth", syncAuth);
        window.addEventListener("focus", syncAuth);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            window.removeEventListener("tatvivah-auth", syncAuth);
            window.removeEventListener("focus", syncAuth);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return { user, token, loading };
}
