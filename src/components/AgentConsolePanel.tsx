import { useMemo, useRef, useState } from "react";

export type ScalarDim = {
  description?: string;
  value: number;
  min?: number;
  max?: number;
};

export type PersonalityMatrix = Record<string, ScalarDim>;
export type EmotionMatrix = Record<string, ScalarDim>;

type AgentConsolePanelProps = {
  agentName?: string;
  expression?: string;
  lastLatency?: number;
  mbti?: string;
  identity?: string;
  personality?: PersonalityMatrix;
  emotions?: EmotionMatrix;
  agentLoaded?: boolean;
};

const DEFAULT_EXPRESSION = "neutral";
const EXT_ORDER = ["jpeg", "jpg", "png", "webp"] as const;
const expressionExtCache = new Map<string, string>();
const API_BASE_NO_VERSION = (import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL_NO_VERSION || "")
  .toString()
  .replace(/\/+$/, "");

function expressionUrl(name: string, ext: string, agentName?: string) {
  const normalizedName = agentName?.toLowerCase();
  return `${API_BASE_NO_VERSION}/static/expressions/${normalizedName}/${name}.${ext}`;
}

function normalizeLabel(value: string) {
  return value.replace(/[_-]/g, " ").toUpperCase();
}

function normalizePercent(dim: ScalarDim) {
  const min = dim.min ?? 0;
  const max = dim.max ?? 100;
  const clamped = Math.max(min, Math.min(max, dim.value ?? 0));
  return ((clamped - min) / (max - min || 1)) * 100;
}

function metricTone(label: string) {
  const key = label.toLowerCase();
  if (key.includes("anger") || key.includes("disgust")) return "warn";
  if (key.includes("fear") || key.includes("sad")) return "cold";
  if (key.includes("joy") || key.includes("love")) return "warm";
  return "default";
}

function ExpressionImage({ expressionName, agentName }: { expressionName: string; agentName?: string }) {
  const cachedExt = expressionExtCache.get(expressionName);
  const initialIndex = cachedExt ? Math.max(0, EXT_ORDER.indexOf(cachedExt as (typeof EXT_ORDER)[number])) : 0;
  const [idx, setIdx] = useState(initialIndex);
  const attemptedFallback = useRef(false);

  const src = useMemo(
    () => expressionUrl(expressionName, EXT_ORDER[idx], agentName),
    [expressionName, idx, agentName]
  );

  return (
    <img
      src={src}
      alt={`${expressionName} expression`}
      className="ss-agent-image"
      onError={(event) => {
        if (idx + 1 < EXT_ORDER.length) {
          setIdx(idx + 1);
          return;
        }

        if (!attemptedFallback.current && expressionName !== DEFAULT_EXPRESSION) {
          attemptedFallback.current = true;
          const fallbackExt = expressionExtCache.get(DEFAULT_EXPRESSION) || EXT_ORDER[0];
          event.currentTarget.src = expressionUrl(DEFAULT_EXPRESSION, fallbackExt, agentName);
        }
      }}
      onLoad={(event) => {
        const loadedSrc = event.currentTarget.src;
        const extension = EXT_ORDER.find((entry) => loadedSrc.endsWith(`.${entry}`));
        if (extension) expressionExtCache.set(expressionName, extension);
      }}
    />
  );
}

function MetricRow({ label, dim }: { label: string; dim: ScalarDim }) {
  const value = Math.round(dim.value ?? 0);
  const tone = metricTone(label);
  return (
    <div className="ss-metric-row">
      <div className="ss-metric-header">
        <span>{normalizeLabel(label)}</span>
        <span>{value}</span>
      </div>
      <div className="ss-metric-track">
        <div
          className={`ss-metric-fill ss-tone-${tone}`}
          style={{ width: `${normalizePercent(dim)}%` }}
          title={dim.description || undefined}
        />
      </div>
    </div>
  );
}

export default function AgentConsolePanel({
  agentName,
  expression,
  lastLatency,
  mbti,
  identity,
  personality,
  emotions,
  agentLoaded,
}: AgentConsolePanelProps) {
  const expressionName = expression?.trim() || DEFAULT_EXPRESSION;
  const [activeTab, setActiveTab] = useState<"description" | "matrix" | "status">("description");

  return (
    <section className="ss-agent-console" aria-label="Agent Console Panel">
      <div className="ss-console-block ss-console-profile">
        <div className="ss-console-title">PROFILE</div>
        <div className="ss-profile-grid">
          <div className="ss-image-frame">
            <ExpressionImage expressionName={expressionName} agentName={agentName} />
            <div className="ss-image-overlay" aria-hidden="true" />
          </div>

          <div className="ss-profile-meta">
            <div className="ss-meta-line">AGENT: {agentLoaded ? agentName || "SYNTHETIC SOUL" : "OFFLINE"}</div>
            <div className="ss-meta-line">MBTI: {mbti || "UNKNOWN"}</div>
            <div className="ss-meta-line">
              LATENCY: {lastLatency != null ? `${lastLatency.toFixed(2)}s` : "---"}
            </div>
            <div className="ss-meta-line">EXPRESSION: {expressionName.toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div className="ss-console-block ss-console-diagnostics">
        <div className="ss-console-title-row">
          <div className="ss-console-title">DIAGNOSTICS</div>
          <div className="ss-console-tabs" role="tablist" aria-label="Diagnostics tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "description"}
              className={`ss-console-tab ${activeTab === "description" ? "is-active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              SELF - PERCEPTION
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "matrix"}
              className={`ss-console-tab ${activeTab === "matrix" ? "is-active" : ""}`}
              onClick={() => setActiveTab("matrix")}
            >
              MATRIX
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "status"}
              className={`ss-console-tab ${activeTab === "status" ? "is-active" : ""}`}
              onClick={() => setActiveTab("status")}
            >
              STATUS
            </button>
          </div>
        </div>

        <div className="ss-tab-panel">
          {activeTab === "description" ? (
            <div className="ss-description-panel">
              <p className="ss-dossier-text ss-dossier-plain" title={identity || undefined}>
                {identity || "NO DOSSIER DATA AVAILABLE."}
              </p>
            </div>
          ) : activeTab === "matrix" ? (
            <div className="ss-metric-list">
              {personality && Object.keys(personality).length > 0 ? (
                Object.entries(personality).map(([label, dim]) => (
                  <MetricRow key={label} label={label} dim={dim} />
                ))
              ) : (
                <div className="ss-empty">PERSONALITY MATRIX OFFLINE.</div>
              )}
            </div>
          ) : (
            <div className="ss-metric-list">
              {emotions && Object.keys(emotions).length > 0 ? (
                Object.entries(emotions).map(([label, dim]) => (
                  <MetricRow key={label} label={label} dim={dim} />
                ))
              ) : (
                <div className="ss-empty">EMOTIONAL STATUS OFFLINE.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
