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
  getAuthHeader: () => Record<string, string>;
};

const AuthCtx = createContext<AuthState | null>(null);

const API_BASE = (import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL || "").toString().replace(/\/+$/, "");
const url = (p: string) => (p.startsWith("http") ? p : `${API_BASE}${p}`);

const LS_TOKEN = "ss_token";

// --- helpers ---------------------------------------------------------------
async function jsonFetch(pathOrUrl: string, init?: RequestInit) {
  const res = await fetch(url(pathOrUrl), {
    ...init,
    credentials: init?.credentials ?? "include",
  });
  const type = res.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  return { res, body };
}

function mergeHeaders(...parts: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();
  for (const part of parts) {
    if (!part) continue;
    const normalized = new Headers(part);
    normalized.forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const idx = cookie.indexOf("=");
    const k = idx >= 0 ? cookie.slice(0, idx) : cookie;
    if (k === name) return decodeURIComponent(cookie.slice(idx + 1));
  }
  return null;
}

function extractApiError(body: unknown, status: number, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const err = b.error;
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      const message = typeof e.message === "string" ? e.message : undefined;
      const code = typeof e.code === "string" ? e.code : undefined;
      if (message && code) return `${message} (${code})`;
      if (message) return message;
      if (code) return code;
    }
    if (typeof b.detail === "string") return b.detail;
  }
  if (typeof body === "string" && body.trim()) return body;
  return `${fallback} ${status}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(LS_TOKEN));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const me = useCallback(async () => {
    if (!token) { setUser(null); return; }
    const { res, body } = await jsonFetch("/auth/me", { headers: mergeHeaders({ Accept: "application/json" }, getAuthHeader()) });
    if (!res.ok) throw new Error(extractApiError(body, res.status, "me"));
    const u = (body?.user ?? body) as AuthUser;
    setUser(u ?? null);
  }, [token, getAuthHeader]);

  const startGuest = useCallback(async () => {
    const { res, body } = await jsonFetch("/auth/guest", { method: "POST", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(extractApiError(body, res.status, "guest"));
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [me]);

  const refresh = useCallback(async () => {
    if (!token) return false;
    const csrf = readCookie("refresh_csrf");
    const { res, body } = await jsonFetch("/auth/refresh", {
      method: "POST",
      headers: mergeHeaders({ Accept: "application/json" }, csrf ? { "X-CSRF-Token": csrf } : undefined),
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
      headers: mergeHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(extractApiError(body, res.status, "login"));
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [me]);

  const claim = useCallback(async (email: string, username: string, password: string) => {
    const { res, body } = await jsonFetch("/auth/claim", {
      method: "POST",
      headers: mergeHeaders({ "Content-Type": "application/json", Accept: "application/json" }, getAuthHeader()),
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) throw new Error(extractApiError(body, res.status, "claim"));
    const t = body?.access_token as string;
    setToken(t); localStorage.setItem(LS_TOKEN, t);
    await me();
  }, [getAuthHeader, me]);

  const logout = useCallback(async () => {
    if (token) {
      await jsonFetch("/auth/logout", { method: "POST", headers: mergeHeaders({ Accept: "application/json" }, getAuthHeader()) }).catch(() => {});
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
      credentials: init.credentials ?? "include",
      headers: mergeHeaders(init.headers, getAuthHeader()),
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
