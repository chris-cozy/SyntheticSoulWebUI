import SyntheticSoul from "./SyntheticSoul";
import { getOrCreateClientId } from "./ids";

export default function App() {
  const clientId = getOrCreateClientId();

  const username = import.meta.env.VITE_SYNTHETIC_SOUL_GUEST_USER + '_' + clientId;

  const BASE = import.meta.env.VITE_SYNTHETIC_SOUL_CHAT_URL;

  // Helper: poll job status with backoff + optional Retry-After
  async function pollJob(statusUrl: string, signal?: AbortSignal) {
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
        return data.result?.response ?? data.result ?? null;
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
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // external API call — adjust to your endpoint + auth
  const ask = async (input: string): Promise<string> => {
    const controller = new AbortController();
    const signal = controller.signal;

    // 1) Kick off the job
    const submitRes = await fetch(`${BASE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, username, type: import.meta.env.VITE_SYNTHETIC_SOUL_DM_TYPE }),
      signal
    });

    // Backward-compat: if server still returns 200 + {response}, just use it
    if (submitRes.ok && submitRes.status !== 202) {
      const data = await submitRes.json();
      return data.response ?? JSON.stringify(data);
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
      : `${(new URL(BASE, window.location.origin)).origin}${locHeader || `/jobs/${job_id}`}`;

    // 3) Poll until done
    return await pollJob(statusUrl, signal);
  };

  return <SyntheticSoul onAsk={ask} title="JASMINE" />;
}
