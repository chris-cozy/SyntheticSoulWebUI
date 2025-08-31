// src/AgentPanel.tsx
import { useMemo, useRef, useState } from "react";

type Props = {
  expression?: string;       // e.g. "happy"
  lastLatency?: number; // seconds
};

const DEFAULT_EXPRESSION = "neutral";
const EXT_ORDER = ["jpg"] as const;

// Cache which extension worked for a given emote name
const expressionExtCache = new Map<string, string>();

// Build URL for an emote + ext
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

export default function AgentPanel({ expression, lastLatency }: Props) {
  // Decide which expression name to attempt (prefer provided, fallback to default)
  const name = expression && expression.trim() ? expression : DEFAULT_EXPRESSION;
  console.log(expression)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/40 to-black/70 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-700/20 px-3 py-2 text-[10px] uppercase tracking-widest text-emerald-300">
        <span>agent status</span>
        <span className="text-emerald-400/70">
          {lastLatency != null ? `${lastLatency.toFixed(2)}s` : "—"}
        </span>
      </div>

      {/* Emote */}
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

      {/* Footer badges */}
      <div className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-widest">
        <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-emerald-300">
          cortex link: ok
        </span>
        <span className="rounded bg-emerald-900/30 px-2 py-0.5 text-emerald-300">
          expression: {expression ?? "—"}
        </span>
      </div>
    </div>
  );
}
