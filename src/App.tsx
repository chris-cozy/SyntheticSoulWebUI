import SyntheticSoul from "./SyntheticSoul";
import { getOrCreateClientId } from "./ids";

export type AskResult = {
  text: string;
  time?: number;     // seconds
  expression?: string;    // filename without extension
};

const AGENT_API_BASE = import.meta.env.VITE_SYNTHETIC_SOUL_BASE_URL || "";

export default function App() {
  const clientId = getOrCreateClientId();
  const username = import.meta.env.VITE_SYNTHETIC_SOUL_GUEST_USER + '_' + clientId;

  // Helper: normalize various server shapes into AskResult
  function normalize(result: any): AskResult {
    // common shapes:
    // - { response: string, time?: number, expression?: string }
    // - { reply: string, ... }
    // - string
    if (result && typeof result === "object") {
      const text = result.response ?? result.reply ?? result.text ?? "";
      const time = typeof result.time === "number" ? result.time : undefined;
      const expression = typeof result.expression === "string" ? result.expression : undefined;
      return { text, time, expression };
    }
    // fallback for primitive/string
    return { text: typeof result === "string" ? result : JSON.stringify(result ?? "") };
  }

  // Helper: poll job status with backoff + optional Retry-After
  async function pollJob(statusUrl: string, signal?: AbortSignal): Promise<AskResult> {
    let attempt = 0;
    const maxAttempts = 40;             // ~2–3 minutes depending on backoff
    const baseDelayMs = 1200;

    while (true) {
      if (signal?.aborted) throw new Error("aborted");
      const res = await fetch(statusUrl, { headers: { "Accept": "application/json" }, signal });

      if (res.status === 404) throw new Error("Job not found");
      if (!res.ok) throw new Error(`Status fetch failed (${res.status})`);

      const data = await res.json(); // { job_id, status, progress?, result?, error? }
      const st = (data.status || "").toLowerCase();

      if (st === "succeeded" || st === "finished") {
        const payload = data.result ?? null;
        return normalize(payload);
      }
      if (st === "failed") {
        throw new Error(data.error || "Job failed");
      }

      // Not done: wait a bit and poll again
      const retryHeader = res.headers.get("Retry-After");
      const retryMs = retryHeader ? Number(retryHeader) * 1000 : 0;
      const backoff = Math.min(8000, baseDelayMs * Math.pow(1.25, attempt)); // gentle backoff
      const delay = Math.max(retryMs, backoff);

      attempt++;
      if (attempt > maxAttempts) {
        throw new Error("Timed out waiting for job");
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // external API call — adjust to your endpoint + auth
  const ask = async (input: string): Promise<AskResult> => {
    const controller = new AbortController();
    const signal = controller.signal;

    // 1) Kick off the job
    const submitRes = await fetch(`${AGENT_API_BASE}/messages/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, username, type: import.meta.env.VITE_SYNTHETIC_SOUL_DM_TYPE }),
      signal
    });

    // Backward-compat: if server still returns 200 + {response}, just use it
    if (submitRes.ok && submitRes.status !== 202) {
      const data = await submitRes.json();
      return normalize(data);
    }

    if (submitRes.status !== 202) {
      const text = await submitRes.text();
      throw new Error(`HTTP ${submitRes.status} – ${text}`);
    }

    // 2) Get job_id + status URL
    const { job_id } = await submitRes.json();
    if (!job_id) throw new Error("No job_id in 202 response");

     // Prefer Location header if present; otherwise construct from env/base path
    const locHeader = submitRes.headers.get("Location"); // e.g., /jobs/<id>
    const statusUrl = locHeader?.startsWith("http")
      ? locHeader
      : `${AGENT_API_BASE}/jobs/${job_id}`;

    // 3) Poll until done
    return await pollJob(statusUrl, signal);
  };

  return <SyntheticSoul onAsk={ask} title="JASMINE" />;
}
