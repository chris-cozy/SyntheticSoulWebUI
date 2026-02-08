import type { KeyboardEvent } from "react";

type TerminalInputBarProps = {
  input: string;
  typing: boolean;
  agentName?: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export default function TerminalInputBar({
  input,
  typing,
  agentName,
  onInputChange,
  onSend,
}: TerminalInputBarProps) {
  const canSend = !typing && input.trim().length > 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="ss-input-shell">
      <div className="ss-input-row">
        <textarea
          id="terminal-input"
          className="ss-input"
          rows={1}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`TYPE MESSAGE TO ${agentName || "SYNTHETIC SOUL"}`}
        />

        <button type="button" className="ss-send-btn" onClick={onSend} disabled={!canSend}>
          TRANSMIT
        </button>
      </div>
    </div>
  );
}
