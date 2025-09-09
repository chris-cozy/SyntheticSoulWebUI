import React, { useEffect, useMemo, useRef, useState } from "react";
import AgentPanel from "./AgentPanel";
import type { AskResult } from "./App";
import { useAuth } from "./auth";
import InsightsPanel from "./InsightsPanel";
import AuthMenu from "./AuthMenu";

type ScalarDim = { description?: string; value: number; min?: number; max?: number };
type PersonalityMatrix = Record<string, ScalarDim>;
type EmotionMatrix = Record<string, ScalarDim>;

const AGENT_API_BASE = (import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL || "")
  .toString()
  .replace(/\/+$/, "");;

const LOCAL_EXPRESSION_TTL_MS = 12000; // 12 seconds

const api = (path: string) => `${AGENT_API_BASE}${path}`;

export default function SyntheticSoul({
  onAsk,
}: {
  onAsk?: (input: string) => Promise<AskResult>;
}) {
  const { token, user, authFetch } = useAuth();
  const activeUsername = user?.username;

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const [agentMBTI, setAgentMBTI] = useState<string | undefined>(undefined);
  const [agentIdentity, setAgentIdentity] = useState<string | undefined>(undefined);
  const [personality, setPersonality] = useState<PersonalityMatrix | undefined>(undefined);
  const [emotions, setEmotions] = useState<EmotionMatrix | undefined>(undefined);
  const [latestThought, setLatestThought] = useState<string>("");
  const [agentLoaded, setAgentLoaded] = useState(false);
  const [agentName, setAgentName] = useState<string>("");
  const [apiVersion, setApiVersion] = useState<string>("")

  const [globalExpression, setGlobalExpression] = useState<string | undefined>(undefined);
  const [localExpression, setLocalExpression] = useState<string | undefined>(undefined);
  const [lastLatency, setLastLatency] = useState<number | undefined>(undefined);
  const [insightsOpen, setInsightsOpen] = useState(false); 

   const [messages, setMessages] = useState<
    { id: number | string; role: "user" | "assistant" | "system"; text: string }[]
  >([]);

  /** Expressions */
  const currentExpression = localExpression ?? globalExpression;

  /** Local Expression TTL */
  useEffect(() => {
    if (localExpression == null) return;
    const id = setTimeout(() => setLocalExpression(undefined), LOCAL_EXPRESSION_TTL_MS);
    return () => clearTimeout(id);
  }, [localExpression]);

  /** Populate version */
  useEffect(() => {
    let cancelled = false;

    async function loadVersion() {
      try{
        const res = await authFetch(api(`/meta/version`), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return; // silently ignore if no history yet
        const data = await res.json();
        const version: string = data?.version || ""
        if (cancelled) return;

        setApiVersion(version);
      } catch {
        /* ignore */
      }
    }

    loadVersion();
  }, []);

  /** Populate chat window with conversation data on page load */
  useEffect(() => {
    let cancelled = false;

    function uniqById<T extends { id: string | number }>(arr: T[]) {
      const seen = new Set<string | number>();
      return arr.filter(m => (seen.has(m.id) ? false : (seen.add(m.id), true)));
    }

    async function loadConversation() {
      try {
        setMessages([
          {
            id: 1,
            role: "system",
            text:
              `VERSION ${apiVersion} — YOU ARE BEING MONITORED FOR YOUR SAFETY — ` + activeUsername,
          },
          {
            id: 2,
            role: "assistant",
            text:
              `WELCOME, USER. I AM ${agentName}. WHAT THOUGHT WOULD YOU LIKE TO SHARE?`,
          },
        ])
        const res = await authFetch(api(`/messages/conversation`), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return; // silently ignore if no history yet
        const data = await res.json();
        const msgs: any[] = data?.conversation?.messages || [];
        if (!msgs.length || cancelled) return;

        // sort ascending by time
        const sorted = [...msgs].sort(
          (a, b) =>
            new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );

        const mapped = sorted.map((m, i) => ({
          id: new Date(m.timestamp || 0).getTime() || i, // stable numeric id
          role: m.from_agent ? ("assistant" as const) : ("user" as const),
          text: m.message ?? "",
        }));
  
        // Replace initial seed with server conversation
        setMessages(prev => uniqById([...prev, ...mapped]));
      } catch {
        /* ignore */
      }
    }

    loadConversation();
  }, [token, activeUsername, agentName]);

  /** Populate Jasmine data */
  useEffect(() => {
    let cancelled = false;

    async function fetchAgent() {
      try {
        const url = api('/agents/active');

        const res = await authFetch(`${url}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Agent fetch ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        // Pull fields
        const agent = data?.agent;
        const name = agent?.name;
        const capName = name ? name.toUpperCase() : "";
        const mbti = agent?.personality?.["myers-briggs"] || agent?.personality?.myersBriggs || agent?.personality?.mbti;
        const idText = agent?.identity as string | undefined;
        const expression = agent?.global_expression;

        const pMatrix: PersonalityMatrix | undefined = agent?.personality?.personality_matrix;
        const eMatrix: EmotionMatrix | undefined = agent?.emotional_status?.emotions;

        setAgentName(capName);
        setAgentMBTI(mbti);
        setAgentIdentity(idText);
        setPersonality(pMatrix);
        setEmotions(eMatrix);
        setAgentLoaded(true);
        setGlobalExpression(expression);
      } catch (err: any) {
        console.warn("Agent fetch failed:", err);
        if (cancelled) return;
        setAgentLoaded(false);
      }
    }

    fetchAgent();

    // poll every 30 seconds (tweak as desired)
    const id = setInterval(fetchAgent, 30 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  /** Populate Latest thought */
  useEffect(() => {
    let cancelled = false;

    async function fetchLatestThought() {
      try {
        const res = await authFetch(api("/thoughts/latest"), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const t = data?.latest_thought?.thought || "";
        setLatestThought(t || "No recent thought.");
      } catch {
        /* ignore */
      }
    }

    fetchLatestThought();
    const id = setInterval(fetchLatestThought, 60 * 1000); // 🔁 1 min
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  /** Smooth scroll to most recent messages */
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || typing) return;

    const userMsg = { id: Date.now(), role: "user" as const, text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setLive("");

    try {
      const ignoreResponse = `${agentName} has chosen to ignore your correspondence.`;
      let result: AskResult = { text: "" };
      if (onAsk) {
        result = await onAsk(trimmed);
      } else {
        // fallback for dev
        result = { text: "ACK (demo)", time: Math.random() * 1.5 + 0.2, expression: "neutral" };
      }

      // Update assistant message text
      const replyText = result.text;
      if (replyText){
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: "assistant", text: replyText },
        ]);
      }else{
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: "system", text: ignoreResponse },
        ]);
      }

      // Update panel fields
      if (result.expression) setLocalExpression(result.expression);
      setLastLatency(result.time);
      
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "assistant",
          text:
            `ERROR: ${agentName} THOUGHT FUNCTION FAILED. PLEASE CHECK SERVER.`,
        },
      ]);
    } finally {
      setTyping(false);
      setLive("");
    }
  }

  const grid = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stop-color='rgba(0,255,180,0.15)'/>
            <stop offset='1' stop-color='rgba(0,180,255,0.05)'/>
          </linearGradient>
        </defs>
        <path d='M0 32 H64 M32 0 V64' stroke='url(#g)' stroke-width='1'/>
      </svg>`);
    return `url("data:image/svg+xml,${svg}")`;
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-green-200">
      {/* CRT lines & ambient glows */}
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px)",
          opacity: 0.25,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(0,255,120,0.2),transparent_40%),radial-gradient(circle_at_30%_120%,rgba(255,0,0,0.15),transparent_40%),radial-gradient(circle_at_110%_10%,rgba(0,120,255,0.2),transparent_35%)]" />

      {/* Header — fixed height */}
      <header className="relative z-[120] h-14 border-b border-emerald-500/30 bg-black/60 px-6 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_2px_rgba(16,185,129,0.75)]" />
            <p className="text-xs tracking-widest text-emerald-300/90">
              <span className="opacity-70">OVERSEER TODAY:</span> 居心地の良い
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Show button to open insights on <xl screens */}
            <button
              onClick={() => setInsightsOpen(true)}
              className="xl:hidden rounded border border-emerald-700/40 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-300"
            >
              insights
            </button>
            {/* title block */}
            <AuthMenu />
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                  <h1 className="text-xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                    SyntheticSoul<span className="text-rose-400">84</span>
                  </h1>
                  <span className="text-[10px] tracking-widest text-emerald-300/70">作成者:居心地の良い — 2025</span>
              </div>
            </div>
          </div>  
      </header>

      {/* Main — fills the rest of the viewport; full-bleed, no page scroll */}
      <main className="relative z-20 h-[calc(100vh-56px)] w-full px-4 sm:px-6 py-4">
        <div className="
          grid h-full gap-4
          grid-cols-1
          lg:grid-cols-[minmax(320px,0.35fr)_1fr]
          xl:grid-cols-[minmax(320px,0.28fr)_1fr_minmax(280px,0.32fr)]
        ">
          {/* LEFT: Agent (no matrices) */}
          <aside className="min-w-0 overflow-auto rounded-2xl border border-emerald-500/25 bg-black/40 p-2">
              <AgentPanel
              agentName={agentName} 
              expression={currentExpression} 
              lastLatency={lastLatency}
              mbti={agentMBTI}
              identity={agentIdentity}
              personality={personality}
              emotions={emotions}
              agentLoaded={agentLoaded}
              showMatrices={false} 
              />
          </aside>

          {/* Middle: Chat column */}
          <section className="min-w-0 grid grid-rows-[auto_1fr_auto] gap-3">
            {/* Title */} 
            <div className="rounded-xl border border-emerald-400/30 bg-black/50 p-3 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-emerald-200/80 tracking-widest">
                  <span className="mr-2">{agentName}</span>· SAVING CONVERSATION DATA…
                </div>
                <div className="text-xs text-emerald-300/70">“DON'T BE EVIL”</div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-emerald-900/50">
                <div className="h-full w-1/3 animate-[load_2.8s_ease_infinite] bg-gradient-to-r from-emerald-400 to-cyan-400" />
              </div>
            </div>

            {/* Chat area (fills remaining height) */}
            <div
              className="relative min-h-0 rounded-2xl border border-emerald-400/30 bg-black/60 p-3 shadow-[0_0_60px_rgba(16,185,129,0.25)]"
              style={{ backgroundImage: `${grid}`, backgroundSize: "64px 64px" }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-emerald-400/10" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-2xl bg-gradient-to-b from-white/5 to-transparent" />

              <div ref={listRef} className="relative z-10 h-full overflow-y-auto pr-1">
                {messages.map((m) => (
                  <Message key={m.id} role={m.role} text={m.text} username={activeUsername} agentName={agentName} />
                ))}

                {typing && (
                  <div className="mt-3">
                    <AssistantBubble>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{agentName} THINKING</span>
                        <Dots />
                      </div>
                      <div className="mt-2 text-emerald-100/90">
                        {live}
                        <span className="animate-pulse">▌</span>
                      </div>
                    </AssistantBubble>
                  </div>
                )}
              </div>
            </div>

            {/* Composer row — with a small ticker above input */}
            <div className="grid grid-rows-[auto_auto] gap-2">
              <section className="xl:hidden rounded-2xl border border-orange-400/40 bg-black/60 p-4 text-orange-200 shadow-[0_0_40px_rgba(251,146,60,0.25)]">
                <p className="text-[12px] md:text-sm lg:text-base tracking-widest">
                  {agentName}'S LATEST THOUGHT — {latestThought || "No recent thought."}
                </p>
              </section>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="h-12 rounded-xl border border-emerald-400/30 bg-black/70 px-4 text-emerald-100 placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  placeholder="ENTER YOUR THOUGHT…"
                />
                <button 
                  onClick={sendMessage}
                  disabled={typing || !input.trim()}
                  className="h-12 rounded-xl border border-cyan-400/40 bg-gradient-to-br from-emerald-600/40 to-cyan-600/30 px-4 text-sm tracking-widest text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition active:scale-95 hover:shadow-[0_0_35px_rgba(34,211,238,0.55)]">
                  TRANSMIT
                </button>
              </div>
            </div>
            <footer className="mb-8 mt-2 text-center text-[10px] tracking-widest text-emerald-300/60">
              <div>YOU WATCH ME · {agentName} WATCHES YOU · SYNTHETIC SOUL</div>
              <div className="mt-1 opacity-70">© 居心地の良い //</div>
            </footer>
          </section>
          {/* Right: Insights (visible on xl+, hidden on smaller) */}
          <aside className="hidden min-w-0 overflow-auto rounded-2xl border border-emerald-500/25 bg-black/40 p-2 xl:block">
            <InsightsPanel personality={personality} emotions={emotions} latestThought={latestThought} />
          </aside>
        </div>
        {/* Off-canvas Insights for <xl screens */}
        {insightsOpen && (
          <div className="xl:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInsightsOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-[86%] sm:w-[420px] max-w-[92vw] overflow-auto border-l border-emerald-700/30 bg-black p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300/80">insights</div>
                <button onClick={() => setInsightsOpen(false)} className="rounded border border-emerald-700/40 px-2 py-1 text-[10px] text-emerald-300">close</button>
              </div>
              <InsightsPanel personality={personality} emotions={emotions} latestThought={latestThought} />
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes load { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        .glitch { position: relative; text-shadow: 0 0 8px rgba(6,182,212,.65), 0 0 24px rgba(16,185,129,.45); }
        .glitch:before, .glitch:after { content: attr(data-text); position: absolute; left:0; right:0; }
        .glitch:before { transform: translate(1px,0); color: rgba(59,130,246,0.8); clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); filter: blur(.5px); }
        .glitch:after { transform: translate(-1px,0); color: rgba(248,113,113,0.8); clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); filter: blur(.5px); }
      `}</style>
  </div>
  );
}

function Message({ role, text, username, agentName }: { role: "user" | "assistant" | "system"; text: string; username: string | undefined; agentName: string | undefined; }) {
  if (role === "system") {
    return (
      <div className="my-2 text-center text-[10px] tracking-widest text-emerald-300/70">
        {text}
      </div>
    );
  }
  const isUser = role === "user";
  return (
    <div className={`mt-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <UserBubble>
          <Label>{username}_//</Label>
          <p className="whitespace-pre-wrap text-emerald-50/90">{text}</p>
        </UserBubble>
      ) : (
        <AssistantBubble>
          <Label>{agentName}_//</Label>
          <p className="whitespace-pre-wrap text-emerald-100/90">{text}</p>
        </AssistantBubble>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 w-fit rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] tracking-widest text-emerald-200">
      {children}
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-900/30 to-emerald-950/40 p-3 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
      {children}
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-cyan-900/20 to-sky-950/40 p-3 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
      {children}
    </div>
  );
}

function Dots() {
  return (
    <div className="flex items-end gap-1">
      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-120ms]" />
      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-60ms]" />
      <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" />
    </div>
  );
}


