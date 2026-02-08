import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: number | string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt?: number;
};

type TerminalChatLogProps = {
  messages: ChatMessage[];
  typing: boolean;
  live: string;
};

export default function TerminalChatLog({ messages, typing, live }: TerminalChatLogProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, number>>(new Map());

  const [renderedById, setRenderedById] = useState<Record<string, string>>({});
  const [animatingById, setAnimatingById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      if (messages.length === 0) return;

      const seededRendered: Record<string, string> = {};
      const seededKnown = new Set<string>();
      messages.forEach((message) => {
        const id = String(message.id);
        seededKnown.add(id);
        seededRendered[id] = message.text;
      });

      knownIdsRef.current = seededKnown;
      setRenderedById(seededRendered);
      initializedRef.current = true;
      return;
    }

    const newMessages = messages.filter((message) => !knownIdsRef.current.has(String(message.id)));
    if (newMessages.length === 0) return;

    // History refreshes can append many messages at once. Render those immediately.
    if (newMessages.length > 1) {
      setRenderedById((prev) => {
        const next = { ...prev };
        newMessages.forEach((message) => {
          const id = String(message.id);
          knownIdsRef.current.add(id);
          next[id] = message.text;
        });
        return next;
      });
      return;
    }

    const message = newMessages[0];
    const id = String(message.id);
    const fullText = message.text;
    const tickSize = fullText.length > 240 ? 3 : 1;
    const tickDelay = message.role === "user" ? 10 : message.role === "assistant" ? 14 : 12;

    knownIdsRef.current.add(id);

    if (fullText.length === 0) {
      setRenderedById((prev) => ({ ...prev, [id]: "" }));
      setAnimatingById((prev) => ({ ...prev, [id]: false }));
      return;
    }

    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }

    setRenderedById((prev) => ({ ...prev, [id]: "" }));
    setAnimatingById((prev) => ({ ...prev, [id]: true }));

    let index = 0;
    const tick = () => {
      index = Math.min(fullText.length, index + tickSize);
      setRenderedById((prev) => ({ ...prev, [id]: fullText.slice(0, index) }));

      if (index < fullText.length) {
        const timer = window.setTimeout(tick, tickDelay);
        timersRef.current.set(id, timer);
        return;
      }

      timersRef.current.delete(id);
      setAnimatingById((prev) => ({ ...prev, [id]: false }));
    };

    const timer = window.setTimeout(tick, tickDelay);
    timersRef.current.set(id, timer);
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, renderedById]);

  return (
    <section className="ss-chat-log" aria-label="Terminal chat log">
      <div className="ss-chat-log-inner" ref={listRef}>
        {messages.map((message) => {
          const id = String(message.id);
          const renderedText = renderedById[id] ?? message.text;
          const isAnimating = !!animatingById[id];
          const lineText = message.role === "user" ? `>> ${renderedText}` : renderedText;

          return (
            <article key={message.id} className={`ss-log-entry ss-log-${message.role}`}>
              <p className="ss-log-text">
                {lineText}
                {isAnimating && <span className="ss-cursor">█</span>}
              </p>
            </article>
          );
        })}

        {typing && (
          <article className="ss-log-entry ss-log-assistant">
            <p className="ss-log-text">
              {live || "THINKING"}
              <span className="ss-cursor">█</span>
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
