function uuid(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // fallback
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
  buf[8] = (buf[8] & 0x3f) | 0x80; // variant
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const h = Array.from(buf, toHex).join("");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function getOrCreateClientId(storageKey = "synthetic-soul.clientId"): string {
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;
    const id = uuid();
    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return uuid(); // privacy mode fallback (non-persistent)
  }
}

export function getOrCreateSessionId(storageKey = "synthetic-soul.sessionId"): string {
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const id = uuid();
    sessionStorage.setItem(storageKey, id);
    return id;
  } catch {
    return uuid();
  }
}