import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id?: string;
  username?: string;
  email?: string | null;
  guest?: boolean;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  // high-level actions
  startGuest: () => Promise<void>;
  refresh: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  claim: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // helpers
  authFetch: (pathOrUrl: string, init?: RequestInit) => Promise<Response>;
  getAuthHeader: () => Record<string, string>  |  string;
};

const AuthCtx = createContext<AuthState | null>(null);

const API_BASE = (import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL || "").toString().replace(/\/+$/, "");
const url = (p: string) => (p.startsWith("http") ? p : `${API_BASE}${p}`);

const LS_TOKEN = "ss_token";

// --- helpers ---------------------------------------------------------------
async function jsonFetch(pathOrUrl: string, init?: RequestInit) {
  const res = await fetch(url(pathOrUrl), init);
  const type = res.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  return { res, body };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = useCallback(() => (token ? { Authorization: `Bearer ${token}` } : ''), [token]);

  const me = useCallback(async () => {
    if (!token) { setUser(null); return; }
    const { res, body } = await jsonFetch("/auth/me", { headers: { Accept: "application/json", ...getAuthHeader() } });
    if (!res.ok) throw new Error(`me ${res.status}`);
    const u = (body?.user ?? body) as AuthUser;
    setUser(u ?? null);
  }, [token, getAuthHeader]);

  const startGuest = useCallback(async () => {
    const { res, body } = await jsonFetch("/auth/guest", { method: "POST", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`guest ${res.status}`);
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [me]);

  const refresh = useCallback(async () => {
    if (!token) return false;
    const { res, body } = await jsonFetch("/auth/refresh", {
      method: "POST",
      headers: { Accept: "application/json", ...getAuthHeader() }
    });
    if (!res.ok) return false;
    const t = body?.access_token as string | undefined;
    if (t) { setToken(t); localStorage.setItem(LS_TOKEN, t); }
    await me();
    return true;
  }, [token, getAuthHeader, me]);

  const login = useCallback(async (email: string, password: string) => {
    const { res, body } = await jsonFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(body?.detail ?? `login ${res.status}`);
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [me]);

  const claim = useCallback(async (email: string, username: string, password: string) => {
    const { res, body } = await jsonFetch("/auth/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...getAuthHeader() },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) throw new Error(body?.detail ?? `claim ${res.status}`);
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [getAuthHeader, me]);

  const logout = useCallback(async () => {
    if (token) {
      await jsonFetch("/auth/logout", { method: "POST", headers: { Accept: "application/json", ...getAuthHeader() } }).catch(() => {});
    }
    localStorage.removeItem(LS_TOKEN);
    setToken(null);
    setUser(null);
    await startGuest(); // immediately create a fresh guest
  }, [token, getAuthHeader, startGuest]);

  // Wrapper that auto-attaches token and retries once after refresh on 401.
  const authFetch = useCallback(async (pathOrUrl: string, init: RequestInit = {}) => {
    const doFetch = () => fetch(url(pathOrUrl), {
      ...init,
      headers: { ...(init.headers || {}), ...getAuthHeader() },
    });
    let r = await doFetch();
    if (r.status === 401) {
      const ok = await refresh();
      if (ok) r = await doFetch();
    }
    return r;
  }, [getAuthHeader, refresh]);

  // boot
  useEffect(() => {
    (async () => {
      try {
        if (token) {
          try {
            await me();
          } catch {
            const ok = await refresh();
            if (!ok) await startGuest();
          }
        } else {
          await startGuest();
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(() => ({
    token, user, loading,
    startGuest, refresh, login, claim, logout,
    authFetch, getAuthHeader,
  }), [token, user, loading, startGuest, refresh, login, claim, logout, authFetch, getAuthHeader]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
