import { useEffect, useMemo, useState } from "react";
import type { AskResult } from "./App";
import AuthMenu from "./AuthMenu";
import { useAuth } from "./auth";
import AgentConsolePanel from "./components/AgentConsolePanel";
import type { EmotionMatrix, PersonalityMatrix } from "./components/AgentConsolePanel";
import HeaderBanner from "./components/HeaderBanner";
import LatestThoughtTicker from "./components/LatestThoughtTicker";
import SuggestedPromptChips from "./components/SuggestedPromptChips";
import TerminalChatLog from "./components/TerminalChatLog";
import type { ChatMessage } from "./components/TerminalChatLog";
import TerminalInputBar from "./components/TerminalInputBar";

const AGENT_API_BASE = (import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL || "")
  .toString()
  .replace(/\/+$/, "");

const LOCAL_EXPRESSION_TTL_MS = 12_000;
const BOOT_LINES = [
  "[BOOT] SYNTHETIC SOUL CORE READY",
  "[BOOT] CRT DISPLAY BUS ONLINE",
  "[BOOT] ENCRYPTION HANDSHAKE STABLE",
  "[BOOT] AGENT MEMORY PARTITIONS MOUNTED",
  "[BOOT] MESSAGE ROUTER LINKED",
  "[BOOT] AWAITING USER AUTHORIZATION",
] as const;

const api = (path: string) => `${AGENT_API_BASE}${path}`;

type StartupPhase = "boot" | "access" | "ready";

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "ACCESS DENIED. TRY AGAIN.";
}

export default function SyntheticSoul({
  onAsk,
}: {
  onAsk?: (input: string) => Promise<AskResult>;
}) {
  const { token, user, loading, authFetch, startGuest, login } = useAuth();
  const activeUsername = user?.username;

  const [startupPhase, setStartupPhase] = useState<StartupPhase>("boot");
  const [bootLineCount, setBootLineCount] = useState(0);

  const [accessMode, setAccessMode] = useState<"menu" | "login">("menu");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState("");

  const [agentMBTI, setAgentMBTI] = useState<string | undefined>(undefined);
  const [agentIdentity, setAgentIdentity] = useState<string | undefined>(undefined);
  const [personality, setPersonality] = useState<PersonalityMatrix | undefined>(undefined);
  const [emotions, setEmotions] = useState<EmotionMatrix | undefined>(undefined);
  const [latestThought, setLatestThought] = useState<string>("");
  const [agentLoaded, setAgentLoaded] = useState(false);
  const [agentName, setAgentName] = useState<string>("");
  const [apiVersion, setApiVersion] = useState<string>("");

  const [globalExpression, setGlobalExpression] = useState<string | undefined>(undefined);
  const [localExpression, setLocalExpression] = useState<string | undefined>(undefined);
  const [lastLatency, setLastLatency] = useState<number | undefined>(undefined);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mobileConsoleOpen, setMobileConsoleOpen] = useState(false);

  const currentExpression = localExpression ?? globalExpression;
  const normalizedAgentName = agentName || "SYNTHETIC SOUL";
  const isConsoleReady = startupPhase === "ready";

  const suggestedPrompts = useMemo(
    () => [
      `Give me your current emotional status summary.`,
      `What is your latest thought process right now?`,
      `Show me your personality matrix highlights.`,
      `What should ${normalizedAgentName} focus on next?`,
    ],
    [normalizedAgentName]
  );

  useEffect(() => {
    if (loading) return;
    if (startupPhase !== "boot") return;

    setBootLineCount(0);

    const hasActiveSession = Boolean(token && user);
    let lineIndex = 0;
    let finishTimer: number | null = null;

    const interval = window.setInterval(() => {
      lineIndex += 1;
      setBootLineCount(Math.min(BOOT_LINES.length, lineIndex));

      if (lineIndex >= BOOT_LINES.length) {
        window.clearInterval(interval);
        finishTimer = window.setTimeout(
          () => setStartupPhase(hasActiveSession ? "ready" : "access"),
          520
        );
      }
    }, 260);

    return () => {
      window.clearInterval(interval);
      if (finishTimer != null) window.clearTimeout(finishTimer);
    };
  }, [loading, token, user, startupPhase]);

  useEffect(() => {
    if (localExpression == null) return;
    const id = setTimeout(() => setLocalExpression(undefined), LOCAL_EXPRESSION_TTL_MS);
    return () => clearTimeout(id);
  }, [localExpression]);

  useEffect(() => {
    if (startupPhase === "ready" && !token) {
      setStartupPhase("access");
      setAccessMode("menu");
      setAccessError(null);
    }
  }, [startupPhase, token]);

  useEffect(() => {
    if (!isConsoleReady || !token) return;

    let cancelled = false;

    async function loadVersion() {
      try {
        const res = await authFetch(api(`/meta/version`), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;

        const data = await res.json();
        const version: string = data?.version || "";
        if (cancelled) return;

        setApiVersion(version);
      } catch {
        // Ignore missing metadata endpoint.
      }
    }

    loadVersion();
    return () => {
      cancelled = true;
    };
  }, [authFetch, token, isConsoleReady]);

  useEffect(() => {
    if (!isConsoleReady || !token) return;

    let cancelled = false;

    function uniqById<T extends { id: string | number }>(arr: T[]) {
      const seen = new Set<string | number>();
      return arr.filter((entry) => {
        if (seen.has(entry.id)) return false;
        seen.add(entry.id);
        return true;
      });
    }

    async function loadConversation() {
      const bootTs = Date.now();
      setMessages([
        {
          id: `boot-${bootTs}`,
          role: "system",
          text: `VERSION ${apiVersion || "--"} // SECURE CHANNEL ACTIVE // ${activeUsername || "GUEST"}`,
          createdAt: bootTs,
        },
        {
          id: `welcome-${bootTs + 1}`,
          role: "assistant",
          text: `WELCOME, USER. I AM ${normalizedAgentName}. SHARE YOUR NEXT THOUGHT.`,
          createdAt: bootTs + 1,
        },
      ]);

      try {
        const res = await authFetch(api(`/messages/conversation`), {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();
        const msgs: any[] = data?.conversation?.messages || [];
        if (!msgs.length || cancelled) return;

        const mapped = [...msgs]
          .sort(
            (a, b) =>
              new Date(a.timestamp || 0).getTime() -
              new Date(b.timestamp || 0).getTime()
          )
          .map((message, index) => {
            const createdAt = new Date(message.timestamp || 0).getTime() || Date.now() + index;
            return {
              id: message.id || createdAt,
              role: message.from_agent ? ("assistant" as const) : ("user" as const),
              text: message.message ?? "",
              createdAt,
            };
          });

        setMessages((prev) => uniqById([...prev, ...mapped]));
      } catch {
        // Ignore conversation history errors.
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [authFetch, token, activeUsername, apiVersion, normalizedAgentName, isConsoleReady]);

  useEffect(() => {
    if (!isConsoleReady || !token) return;

    let cancelled = false;

    async function fetchAgent() {
      try {
        const res = await authFetch(api(`/agents/active`), {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`Agent fetch ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        const agent = data?.agent;
        const name = agent?.name;
        const capName = name ? String(name).toUpperCase() : "SYNTHETIC SOUL";
        const mbti =
          agent?.personality?.["myers-briggs"] ||
          agent?.personality?.myersBriggs ||
          agent?.personality?.mbti;
        const idText = agent?.identity as string | undefined;
        const expression = agent?.global_expression;

        const personalityMatrix: PersonalityMatrix | undefined =
          agent?.personality?.personality_matrix;
        const emotionMatrix: EmotionMatrix | undefined =
          agent?.emotional_status?.emotions;

        setAgentName(capName);
        setAgentMBTI(mbti);
        setAgentIdentity(idText);
        setPersonality(personalityMatrix);
        setEmotions(emotionMatrix);
        setAgentLoaded(true);
        setGlobalExpression(expression);
      } catch {
        if (cancelled) return;
        setAgentLoaded(false);
      }
    }

    fetchAgent();
    const id = setInterval(fetchAgent, 30_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [authFetch, token, isConsoleReady]);

  useEffect(() => {
    if (!isConsoleReady || !token) return;

    let cancelled = false;

    async function fetchLatestThought() {
      try {
        const res = await authFetch(api("/thoughts/latest"), {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        const thought = data?.latest_thought?.thought || "";
        setLatestThought(thought || "NO RECENT THOUGHT AVAILABLE.");
      } catch {
        // Ignore thought endpoint errors.
      }
    }

    fetchLatestThought();
    const id = setInterval(fetchLatestThought, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [authFetch, token, isConsoleReady]);

  async function continueAsGuest() {
    if (accessBusy) return;

    setAccessBusy(true);
    setAccessError(null);

    try {
      if (!token || !user?.guest) {
        await startGuest();
      }
      setStartupPhase("ready");
    } catch (error) {
      setAccessError(toErrorMessage(error));
    } finally {
      setAccessBusy(false);
    }
  }

  async function submitLogin() {
    if (accessBusy) return;

    if (!loginEmail.trim() || !loginPassword) {
      setAccessError("EMAIL AND PASSWORD ARE REQUIRED.");
      return;
    }

    setAccessBusy(true);
    setAccessError(null);

    try {
      await login(loginEmail.trim(), loginPassword);
      setStartupPhase("ready");
    } catch (error) {
      setAccessError(toErrorMessage(error));
    } finally {
      setAccessBusy(false);
    }
  }

  async function sendMessage() {
    if (!isConsoleReady) return;

    const trimmed = input.trim();
    if (!trimmed || typing) return;

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: now,
      role: "user",
      text: trimmed,
      createdAt: now,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);
    setLive("");

    try {
      const result = onAsk
        ? await onAsk(trimmed)
        : { text: "ACK (demo)", time: Math.random() * 1.5 + 0.2, expression: "neutral" };

      const replyText = result.text || `${normalizedAgentName} HAS CHOSEN SILENCE.`;
      const role = result.text ? "assistant" : "system";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role,
          text: replyText,
          createdAt: Date.now() + 1,
        },
      ]);

      if (result.expression) setLocalExpression(result.expression);
      setLastLatency(result.time);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "system",
          text: `ERROR: ${normalizedAgentName} THOUGHT FUNCTION FAILED. CHECK SERVER LINK.`,
          createdAt: Date.now() + 2,
        },
      ]);
    } finally {
      setTyping(false);
      setLive("");
    }
  }

  if (!isConsoleReady) {
    const bootProgress = `${Math.round((bootLineCount / BOOT_LINES.length) * 100)}%`;

    return (
      <div className="ss-startup-shell">
        <div className="ss-crt-layer" aria-hidden="true" />
        <div className="ss-noise-layer" aria-hidden="true" />

        <section className="ss-startup-card" aria-label="Startup sequence">
          <header className="ss-startup-header">
            <span>SECURE ACCESS TERMINAL</span>
            <span>PHASE::{startupPhase.toUpperCase()}</span>
          </header>

          <div className="ss-startup-body">
            <div className="ss-startup-brand">
              <span className="ss-brand-synthetic">Synthetic</span>
              <span className="ss-brand-soul">Soul</span>
            </div>

            {startupPhase === "boot" && (
              <>
                <div className="ss-boot-log">
                  {BOOT_LINES.slice(0, bootLineCount).map((line) => (
                    <p key={line} className="ss-boot-line">
                      {line}
                    </p>
                  ))}
                  <p className="ss-boot-line ss-boot-pulse">
                    {loading ? "[BOOT] AUTH SESSION VERIFYING" : "[BOOT] INITIALIZING ACCESS PORTAL"}
                    <span className="ss-cursor">█</span>
                  </p>
                </div>

                <div className="ss-boot-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
                  <div className="ss-boot-progress-bar" style={{ width: bootProgress }} />
                </div>
              </>
            )}

            {startupPhase === "access" && (
              <div className="ss-access-panel">
                <div className="ss-access-title">AUTHORIZATION REQUIRED</div>

                {accessMode === "menu" ? (
                  <div className="ss-access-actions">
                    {user && !user.guest && (
                      <button
                        type="button"
                        className="ss-access-btn"
                        onClick={() => setStartupPhase("ready")}
                        disabled={accessBusy}
                      >
                        CONTINUE AS @{user.username?.toUpperCase() || "USER"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ss-access-btn"
                      onClick={() => {
                        setAccessMode("login");
                        setAccessError(null);
                      }}
                      disabled={accessBusy}
                    >
                      LOGIN TO ACCOUNT
                    </button>

                    <button
                      type="button"
                      className="ss-access-btn"
                      onClick={continueAsGuest}
                      disabled={accessBusy}
                    >
                      CONTINUE AS GUEST
                    </button>
                  </div>
                ) : (
                  <div className="ss-access-form">
                    <label htmlFor="startup-email">EMAIL</label>
                    <input
                      id="startup-email"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      autoComplete="email"
                    />

                    <label htmlFor="startup-password">PASSWORD</label>
                    <input
                      id="startup-password"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      autoComplete="current-password"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void submitLogin();
                        }
                      }}
                    />

                    <div className="ss-access-actions ss-access-actions-inline">
                      <button
                        type="button"
                        className="ss-access-btn"
                        onClick={() => {
                          setAccessMode("menu");
                          setAccessError(null);
                        }}
                        disabled={accessBusy}
                      >
                        BACK
                      </button>
                      <button
                        type="button"
                        className="ss-access-btn"
                        onClick={() => void submitLogin()}
                        disabled={accessBusy}
                      >
                        {accessBusy ? "VERIFYING..." : "ENTER"}
                      </button>
                    </div>
                  </div>
                )}

                {accessError && <div className="ss-access-error">{accessError}</div>}

                <div className="ss-access-disclaimer">
                  UNAUTHORIZED ACCESS IS PROHIBITED. ALL SESSION EVENTS ARE LOGGED.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ss-app-shell">
      <div className="ss-crt-layer" aria-hidden="true" />
      <div className="ss-noise-layer" aria-hidden="true" />

      <HeaderBanner
        username={activeUsername}
        apiVersion={apiVersion}
        authMenu={<AuthMenu />}
      />

      <main className="ss-main-grid">
        <section className="ss-console-column">
          <button
            type="button"
            className="ss-mobile-console-toggle"
            onClick={() => setMobileConsoleOpen((value) => !value)}
            aria-expanded={mobileConsoleOpen}
          >
            [{mobileConsoleOpen ? "HIDE" : "SHOW"}] AGENT CONSOLE
          </button>

          <div className={`ss-console-frame ${mobileConsoleOpen ? "is-open" : ""}`}>
            <AgentConsolePanel
              agentName={normalizedAgentName}
              expression={currentExpression}
              lastLatency={lastLatency}
              mbti={agentMBTI}
              identity={agentIdentity}
              personality={personality}
              emotions={emotions}
              agentLoaded={agentLoaded}
            />
          </div>
        </section>

        <section className="ss-chat-column">
          <LatestThoughtTicker thought={latestThought} />

          <TerminalChatLog
            messages={messages}
            typing={typing}
            live={live}
          />

          <SuggestedPromptChips
            prompts={suggestedPrompts}
            disabled={typing}
            onPick={(prompt) => setInput(prompt)}
          />

          <TerminalInputBar
            input={input}
            typing={typing}
            agentName={normalizedAgentName}
            onInputChange={setInput}
            onSend={sendMessage}
          />
        </section>
      </main>
    </div>
  );
}
