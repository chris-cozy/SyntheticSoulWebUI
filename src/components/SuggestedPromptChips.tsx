type SuggestedPromptChipsProps = {
  prompts: string[];
  disabled?: boolean;
  onPick: (prompt: string) => void;
};

export default function SuggestedPromptChips({
  prompts,
  disabled,
  onPick,
}: SuggestedPromptChipsProps) {
  return (
    <div className="ss-chip-row" aria-label="Suggested prompts">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="ss-chip"
          onClick={() => onPick(prompt)}
          disabled={disabled}
        >
          [{prompt}]
        </button>
      ))}
    </div>
  );
}
