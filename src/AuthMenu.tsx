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
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (error: any) {
      setErr(error?.message || "FAILED");
    }
  };

  return (
    <div className="ss-auth-menu">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ss-auth-trigger"
      >
        {busy ? "..." : user?.username ? `@${user.username.toUpperCase()}` : "GUEST"}
      </button>

      {open && (
        <div className="ss-auth-popover">
          {!mode && (
            <div className="ss-auth-section">
              <div className="ss-auth-row">
                <span>ACCOUNT</span>
                <span>{user?.email ?? (user?.guest ? "GUEST" : "")}</span>
              </div>

              <button type="button" className="ss-auth-btn" onClick={() => setMode("login")}>
                LOGIN
              </button>
              <button type="button" className="ss-auth-btn" onClick={() => setMode("claim")}>
                CLAIM ACCOUNT
              </button>
              <button type="button" className="ss-auth-btn" onClick={logout}>
                LOGOUT
              </button>
            </div>
          )}

          {mode && (
            <div className="ss-auth-section">
              <div className="ss-auth-row">
                <span>{mode.toUpperCase()}</span>
                <span>SECURE FORM</span>
              </div>

              <input
                className="ss-auth-input"
                placeholder="EMAIL"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              {mode === "claim" && (
                <input
                  className="ss-auth-input"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              )}

              <input
                className="ss-auth-input"
                placeholder="PASSWORD"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {err && <div className="ss-auth-error">{err}</div>}

              <div className="ss-auth-actions">
                <button
                  type="button"
                  className="ss-auth-btn"
                  onClick={() => {
                    setMode(null);
                    setErr(null);
                  }}
                >
                  BACK
                </button>
                <button type="button" className="ss-auth-btn" onClick={submit}>
                  SUBMIT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
