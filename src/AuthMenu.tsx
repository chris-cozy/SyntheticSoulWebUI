import { useState } from "react";
import { useAuth } from "./auth";

export default function AuthMenu() {
  const { user, loading, login, claim, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "claim" | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const busy = loading;

  const submit = async () => {
    setErr(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "claim") {
        await claim(email, username, password);
      }
      setOpen(false);
      setMode(null);
      setEmail(""); setUsername(""); setPassword("");
    } catch (e: any) {
      setErr(e?.message || "Failed");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="rounded-md border border-emerald-700/40 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-300"
      >
        {busy ? "…" : user?.username ? `@${user.username}` : "guest"}
      </button>

      {open && (
        <div className="fixed right-3 top-14 z-[200] w-64 rounded-lg border border-emerald-700/30 bg-black/80 p-3 text-emerald-200 shadow-xl backdrop-blur">
          {!mode && (
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-widest text-emerald-300/80">account</span>
                <span className="text-emerald-400/70">{user?.email ?? (user?.guest ? "guest" : "")}</span>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setMode("login")} className="rounded border border-emerald-700/30 px-2 py-1 text-left hover:bg-emerald-900/20">login</button>
                <button onClick={() => setMode("claim")} className="rounded border border-emerald-700/30 px-2 py-1 text-left hover:bg-emerald-900/20">claim account</button>
                <button onClick={logout} className="rounded border border-emerald-700/30 px-2 py-1 text-left hover:bg-emerald-900/20">logout</button>
              </div>
            </div>
          )}

          {mode && (
            <div className="space-y-2 text-[11px]">
              <div className="uppercase tracking-widest text-emerald-300/80">{mode}</div>
              <div className="space-y-2">
                <input className="w-full rounded border border-emerald-700/30 bg-black/60 px-2 py-1 text-emerald-100"
                       placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
                {mode === "claim" && (
                  <input className="w-full rounded border border-emerald-700/30 bg-black/60 px-2 py-1 text-emerald-100"
                         placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
                )}
                <input className="w-full rounded border border-emerald-700/30 bg-black/60 px-2 py-1 text-emerald-100"
                       placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              {err && <div className="text-rose-400">{err}</div>}
              <div className="flex gap-2 pt-1">
                <button onClick={()=>{ setMode(null); setErr(null);} } className="rounded border border-emerald-700/30 px-2 py-1">back</button>
                <button onClick={submit} className="rounded border border-emerald-700/30 bg-emerald-900/30 px-2 py-1">submit</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
