type LatestThoughtTickerProps = {
  thought: string;
};

export default function LatestThoughtTicker({ thought }: LatestThoughtTickerProps) {
  const value = thought?.trim() ? thought.trim() : "NO RECENT THOUGHT AVAILABLE.";
  const tickerText = `LATEST THOUGHT :: ${value} :: `;

  return (
    <div className="ss-ticker" role="status" aria-live="polite" aria-label="Latest thought ticker">
      <div className="ss-ticker-track">
        <span>{tickerText}</span>
        <span>{tickerText}</span>
      </div>
    </div>
  );
}
