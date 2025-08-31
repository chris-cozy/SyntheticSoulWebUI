// src/AgentPanel.tsx
import { useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */
type ScalarDim = { description?: string; value: number; min?: number; max?: number };
type PersonalityMatrix = Record<string, ScalarDim>;
type EmotionMatrix = Record<string, ScalarDim>;

type Props = {
  expression?: string;       // e.g. "happy"
  lastLatency?: number; // seconds
  mbti?: string;              // e.g., "ISFP"
  identity?: string;          // short sentence is best here
  personality?: PersonalityMatrix;
  emotions?: EmotionMatrix;
  agentLoaded?: boolean;
};

/* ---------- Emote loader (public/emotes/*, multi-ext, cached) ---------- */
const DEFAULT_EXPRESSION = "neutral";
const EXT_ORDER = ["jpg"] as const;
const expressionExtCache = new Map<string, string>();

function expressionUrl(name: string, ext: string) {
  return `/expressions/${name}.${ext}`;
}

/**
 * Small image component that tries multiple extensions in order.
 * Caches the successful extension so future loads skip straight to it.
 */
function ExpressionImage({ name }: { name: string }) {
  const cachedExt = expressionExtCache.get(name);
  const initialIndex = cachedExt ? Math.max(0, EXT_ORDER.indexOf(cachedExt as any)) : 0;

  const [idx, setIdx] = useState<number>(initialIndex);
  const attemptedFallback = useRef(false);

  const src = useMemo(() => expressionUrl(name, EXT_ORDER[idx] as string), [name, idx]);

  console.log(src)

  return (
    <img
      src={src}
      alt={name}
      className="h-full w-full object-cover opacity-90"
      onError={(ev) => {
        const target = ev.currentTarget;

        // Try next extension
        if (idx + 1 < EXT_ORDER.length) {
          setIdx(idx + 1);
          return;
        }

        // If all failed and not already tried default
        if (!attemptedFallback.current && name !== DEFAULT_EXPRESSION) {
          attemptedFallback.current = true;

          // Try default expression across extensions
          let i = 0;
          const tryDefault = () => {
            if (i >= EXT_ORDER.length) return; // give up
            const candidate = expressionUrl(DEFAULT_EXPRESSION, EXT_ORDER[i]);
            const testImg = new Image();
            testImg.onload = () => {
              target.src = candidate;
              expressionExtCache.set(DEFAULT_EXPRESSION, EXT_ORDER[i]);
            };
            testImg.onerror = () => {
              i++;
              tryDefault();
            };
            testImg.src = candidate;
          };
          tryDefault();
        }
      }}
      onLoad={(ev) => {
        const url = ev.currentTarget.src;
        const ext = EXT_ORDER.find((x) => url.endsWith(`.${x}`));
        if (ext) expressionExtCache.set(name, ext);
      }}
    />
  );
}

/* ---------- Visual atoms ---------- */
function pct(val: number, min = 0, max = 100) {
  const v = Math.max(min, Math.min(max, val ?? 0));
  return ((v - min) / (max - min || 1)) * 100;
}

function GlowDot({ value, color = "emerald" }: { value: number; color?: "emerald" | "rose" | "sky" | "amber" }) {
  const on = value >= 60;
  const palette =
    color === "rose" ? (on ? "bg-rose-400" : "bg-rose-900/50") :
    color === "sky"  ? (on ? "bg-sky-400"  : "bg-sky-900/50")  :
    color === "amber"? (on ? "bg-amber-400": "bg-amber-900/50") :
                       (on ? "bg-emerald-400" : "bg-emerald-900/50");
  return <span className={`inline-block h-2 w-2 rounded-full ${palette} ${on ? "animate-pulse" : ""}`} />;
}

/* Gradient class for personality bars */
const P_BAR = "bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-600";

/* Emotion → gradient + indicator color */
function emotionStyle(label: string) {
  const k = label.toLowerCase();
  if (k === "joy" || k === "love")       return { grad: "from-emerald-400 to-cyan-400", dot: "emerald" as const };
  if (k === "anger" || k === "disgust")  return { grad: "from-rose-500 to-red-600",      dot: "rose" as const };
  if (k === "fear"  || k === "sadness")  return { grad: "from-sky-400 to-indigo-500",    dot: "sky"  as const };
  if (k === "surprise")                  return { grad: "from-amber-400 to-orange-500",  dot: "amber" as const };
  return { grad: "from-emerald-400 to-cyan-400", dot: "emerald" as const };
}

/* Row renderers */
function PersonalityRow({ label, dim }: { label: string; dim: ScalarDim }) {
  const value = Math.round(dim.value ?? 0);
  const width = `${pct(dim.value, dim.min, dim.max)}%`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
        <div className="flex items-center gap-2">
          <GlowDot value={value} />
          <span className="truncate">{label.replace(/_/g, " ")}</span>
        </div>
        <span className="text-emerald-400/70 tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-emerald-900/30">
        <div
          className={`h-2 rounded ${P_BAR} [animation:barflow_3s_ease-in-out_infinite]`}
          style={{ width }}
          title={dim.description || ""}
        />
      </div>
    </div>
  );
}

/* Group personality by theme for readability */
function groupPersonality(p?: PersonalityMatrix) {
  if (!p) return [];
  const pick = (keys: string[]) =>
    keys.filter((k) => k in p).map((k) => [k, p[k]!] as const);

  return [
    { title: "Relational Traits", items: pick(["warmth", "empathy_compassion", "trust_reliability"]) },
    { title: "Drive / Agency",   items: pick(["assertiveness_confidence", "adaptability", "discipline_responsibility"]) },
    { title: "Stability",        items: pick(["emotional_stability", "perspective"]) },
    { title: "Play & Curiosity", items: pick(["playfulness", "curiosity_creativity"]) },
    // any remaining keys (future-proof)
    { title: "Other",            items: Object.entries(p).filter(([k]) =>
        !["warmth","empathy_compassion","trust_reliability",
          "assertiveness_confidence","adaptability","discipline_responsibility",
          "emotional_stability","perspective","playfulness","curiosity_creativity"
        ].includes(k))
    },
  ].filter((g) => g.items.length);
}

function EmotionRow({ label, dim }: { label: string; dim: ScalarDim }) {
  const value = Math.round(dim.value ?? 0);
  const width = `${pct(dim.value, dim.min, dim.max)}%`;
  const { grad, dot } = emotionStyle(label);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
        <div className="flex items-center gap-2">
          <GlowDot value={value} color={dot} />
          <span className="truncate">{label}</span>
        </div>
        <span className="text-emerald-400/70 tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-emerald-900/30">
        <div
          className={`h-2 rounded bg-gradient-to-r ${grad} [animation:barflow_3s_ease-in-out_infinite]`}
          style={{ width }}
          title={dim.description || ""}
        />
      </div>
    </div>
  );
}

/* ---------- Panel ---------- */
export default function AgentPanel({ 
  expression, 
  lastLatency,
  mbti,
  identity,
  personality,
  emotions,
  agentLoaded 
}: Props) {
  // Decide which expression name to attempt (prefer provided, fallback to default)
  const name = expression && expression.trim() ? expression : DEFAULT_EXPRESSION;
  const groups = useMemo(() => groupPersonality(personality), [personality]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/40 to-black/70 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-700/20 px-3 py-2 text-[10px] uppercase tracking-widest text-emerald-300">
        <span>{agentLoaded ? "agent online" : "agent offline"}</span>
        <span className="text-emerald-400/70">
          {lastLatency != null ? `${lastLatency.toFixed(2)}s` : "—"}
        </span>
      </div>

      {/* Expression */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ExpressionImage name={name} />

        {/* scanline/grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-screen"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,100,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      {/* Identity / MBTI badges */}
      <div className="flex flex-col gap-1 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-widest">
          {mbti && <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-emerald-300">mbti: {mbti}</span>}
          {name && <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-emerald-300">expression: {name}</span>}
        </div>
        {identity && (
          <div className="rounded border border-emerald-600/20 bg-black/40 p-2 text-[10px] leading-relaxed text-emerald-200/80">
            {identity}
          </div>
        )}
      </div>

      {/* Personality (grouped, collapsible) */}
      {groups.length > 0 && (
        <div className="px-3 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-emerald-400/80">personality matrix</div>
          <div className="flex flex-col gap-2">
            {groups.map((g, i) => (
              <details key={i} open className="rounded-lg border border-emerald-700/20 bg-black/30 p-2">
                <summary className="cursor-pointer select-none text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
                  {g.title}
                </summary>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {g.items.map(([k, v]) => <PersonalityRow key={k} label={k} dim={v} />)}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Status (heat-mapped) */}
      {emotions && (
        <div className="px-3 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-emerald-400/80">emotional status</div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(emotions).map(([k, v]) => <EmotionRow key={k} label={k} dim={v} />)}
          </div>
        </div>
      )}

      {/* Local keyframes for barflow */}
      <style>{`
        @keyframes barflow { 
          0% { filter: drop-shadow(0 0 0 rgba(16,185,129,0.0)); }
          50% { filter: drop-shadow(0 0 6px rgba(34,211,238,0.45)); }
          100% { filter: drop-shadow(0 0 0 rgba(16,185,129,0.0)); }
        }
      `}</style>
    </div>
  );
}
