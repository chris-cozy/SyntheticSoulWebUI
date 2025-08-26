import React, { useEffect, useMemo, useRef, useState } from "react";
import { getOrCreateClientId } from "./ids";

// Retro-84 Chatbot UI — API-ready version
// - Accepts an optional `onAsk` prop that returns a Promise<string>
// - If `onAsk` is omitted, a playful local mock reply is used
// - Keep this file as src/components/Retro84Chatbot.tsx

export default function SyntheticSoul({
  onAsk,
  title = "JASMINE",
}: {
  onAsk?: (input: string) => Promise<string>;
  title?: string;
}) {
  const clientId = getOrCreateClientId();
  const [messages, setMessages] = useState<
    { id: number; role: "user" | "assistant" | "system"; text: string }[]
  >([
    {
      id: 1,
      role: "system",
      text:
        "VERSION 1.0 — YOU ARE BEING MONITORED FOR YOUR SAFETY — " + clientId,
    },
    {
      id: 2,
      role: "assistant",
      text:
        "WELCOME, USER. I AM JASMINE. ALL QUERIES ARE LOGGED. WHAT THOUGHT WOULD YOU LIKE TO SHARE?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

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
      const ignoreResponse = "JASMINE has chosen to ignore your correspondence.";
      const reply = onAsk
        ? await onAsk(trimmed)
        : null;

      console.log("REPLY:" + reply);

      if (reply){
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: "assistant", text: reply },
        ]);
      }else{
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: "system", text: ignoreResponse },
        ]);
      }
      
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "assistant",
          text:
            "ERROR: EXTERNAL THOUGHT FUNCTION FAILED TO RESPOND. PLEASE CHECK YOUR NETWORK, CORS, OR AUTH KEYS.",
        },
      ]);
    } finally {
      setTyping(false);
      setLive("");
    }
  }

  /*
  // Mock type-out reply used when onAsk is not supplied
  function mockGenerateReplyText(user: string) {
    const templates = [
      `AFFIRMATIVE. PROCESSING: "${user.toUpperCase()}". TRUST IN THE SYSTEM.`,
      `REQUEST "${user.toUpperCase()}" RECEIVED. SAVING SEARCH DATA… DO NOT BE EVIL.`,
      `QUERY ACCEPTED: ${user.toUpperCase()}. JASMINE84 LOADING MODULES…`,
      `COMPLIANCE SAYS THIS IS A PREMIUM THOUGHT. UNLOCKING AFTER ADVERTISEMENT… JUST KIDDING (FOR NOW).`,
    ];
    const t = templates[Math.floor(Math.random() * templates.length)];
    return (
      t +
      "\n\n> NOTE: ALL RESPONSES ARE EPHEMERAL UNLESS OTHERWISE MANDATED BY THE GOVERNING BODY."
    );
  }

  
  function mockGenerateReply(user: string, onChunk?: (t: string) => void) {
    return new Promise<string>((resolve) => {
      const full = mockGenerateReplyText(user);
      let acc = "";
      const chars = full.split("");
      const timer = setInterval(() => {
        if (!chars.length) {
          clearInterval(timer);
          onChunk?.(acc);
          resolve(full);
          return;
        }
        acc += chars.shift();
        onChunk?.(acc + (Math.random() > 0.85 ? "_" : ""));
      }, 18);
    });
  }
    */

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
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-green-200">
      {/* CRT lines + glows */}
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px)",
          opacity: 0.25,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(0,255,120,0.2),transparent_40%),radial-gradient(circle_at_30%_120%,rgba(255,0,0,0.15),transparent_40%),radial-gradient(circle_at_110%_10%,rgba(0,120,255,0.2),transparent_35%)]" />

      {/* Top status bar */}
      <header className="relative z-20 border-b border-emerald-500/30 bg-black/60 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_2px_rgba(16,185,129,0.75)]" />
            <p className="text-xs sm:text-sm tracking-widest text-emerald-300/90">
              <span className="opacity-70">OVERSEER TODAY:</span> 居心地の良い · THOUGHTCRIMES COMMITTED: 0
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
              {title}<span className="text-rose-400">84</span>
            </h1>
            <span className="text-[10px] tracking-widest text-emerald-300/70">作成者:居心地の良い — 2025</span>
          </div>
        </div>
      </header>

      {/* Content panel */}
      <main className="relative z-20 mx-auto mt-6 flex max-w-5xl flex-col gap-3 px-3 sm:px-4">
        {/* Glitch title bar */}
        <section className="rounded-2xl border border-emerald-400/30 bg-black/50 p-4 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-emerald-200/80 tracking-widest">
              <span className="mr-2">JASMINE</span>· SAVING CONVERSATION DATA…
            </div>
            <div className="text-xs text-emerald-300/70">“DON'T BE EVIL”</div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-emerald-900/50">
            <div className="h-full w-1/3 animate-[load_2.8s_ease_infinite] bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
        </section>

        {/* Chat area */}
        <section
          className="relative rounded-2xl border border-emerald-400/30 bg-black/60 p-3 sm:p-4 shadow-[0_0_60px_rgba(16,185,129,0.25)]"
          style={{ backgroundImage: `${grid}`, backgroundSize: "64px 64px" }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-emerald-400/10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-white/5 to-transparent" />

          <div ref={listRef} className="relative z-10 max-h-[60vh] overflow-y-auto pr-1">
            {messages.map((m) => (
              <Message key={m.id} role={m.role} text={m.text} />
            ))}

            {typing && (
              <div className="mt-3">
                <AssistantBubble>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">JASMINE THINKING</span>
                    <Dots />
                  </div>
                  <div className="mt-2 text-emerald-100/90">{live}<span className="animate-pulse">▌</span></div>
                </AssistantBubble>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="relative z-10 mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="ENTER YOUR THOUGHT…"
              className="flex-1 rounded-xl border border-emerald-400/30 bg-black/70 px-4 py-3 text-emerald-100 placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            />
            <button
              onClick={sendMessage}
              className="rounded-xl border border-cyan-400/40 bg-gradient-to-br from-emerald-600/40 to-cyan-600/30 px-4 py-3 text-sm tracking-widest text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition active:scale-95 hover:shadow-[0_0_35px_rgba(34,211,238,0.55)]"
            >
              TRANSMIT
            </button>
          </div>
        </section>

        {/* Premium notice bar */}
        <section className="rounded-2xl border border-orange-400/40 bg-black/60 p-4 text-orange-200 shadow-[0_0_40px_rgba(251,146,60,0.25)]">
          <p className="text-xs sm:text-sm tracking-widest">PREMIUM — THIS THOUGHT IS LOCKED. UNLOCK FOR ·0001 BTC PER CHARACTER · THANK YOU FOR YOUR PURCHASE · THOUGHT WILL LOAD AFTER A SHORT 30 SECOND ADVERTISEMENT.</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-orange-900/40">
            <div className="h-full w-1/4 animate-[load_3s_linear_infinite] bg-gradient-to-r from-orange-400 via-rose-400 to-red-500" />
          </div>
        </section>

        <footer className="mb-8 mt-2 text-center text-[10px] tracking-widest text-emerald-300/60">
          YOU WATCH ME · I WATCH YOU · JASMINE · SYNTHETIC SOUL
        </footer>
      </main>

      <div className="pointer-events-none absolute bottom-3 right-4 z-20 text-[10px] tracking-widest text-emerald-300/60">
        © 居心地の良い //
      </div>

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

function Message({ role, text }: { role: "user" | "assistant" | "system"; text: string }) {
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
          <Label>GUEST_{getOrCreateClientId()}_//</Label>
          <p className="whitespace-pre-wrap text-emerald-50/90">{text}</p>
        </UserBubble>
      ) : (
        <AssistantBubble>
          <Label>JASMINE_//</Label>
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


