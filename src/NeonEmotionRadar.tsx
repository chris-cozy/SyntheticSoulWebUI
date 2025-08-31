// src/NeonEmotionRadar.tsx
import { useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Dim = { label: string; value: number; min?: number; max?: number };

// heat colors per emotion (fits your bars’ mapping)
const EMO_COLORS: Record<string, string> = {
  joy: "#34d399",         // emerald-400
  love: "#22d3ee",        // cyan-400
  surprise: "#f59e0b",    // amber-500
  anger: "#ef4444",       // red-500
  disgust: "#f43f5e",     // rose-500
  fear: "#60a5fa",        // blue-400
  sadness: "#6366f1",     // indigo-500
};

function clampToPct(v = 0, min = 0, max = 100) {
  const nv = Math.max(min ?? 0, Math.min(max ?? 100, v));
  return ((nv - (min ?? 0)) / ((max ?? 100) - (min ?? 0) || 1)) * 100;
}

export default function NeonEmotionRadar({
  dims,
  title = "emotions",
}: {
  title?: string;
  // supply in your preferred order
  dims: Dim[];
}) {
  const { labels, values, pointColors } = useMemo(() => {
    const labels = dims.map((d) => d.label);
    const values = dims.map((d) => clampToPct(d.value, d.min, d.max));
    const pointColors = dims.map((d) => EMO_COLORS[d.label.toLowerCase()] ?? "#34d399");
    return { labels, values, pointColors };
  }, [dims]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: "rgba(34,211,238,0.9)",      // cyan outline
          backgroundColor: "rgba(16,185,129,0.15)",  // emerald fill
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: pointColors,         // heat per point
          pointBorderColor: pointColors,
          fill: true,
          tension: 0.25,
        },
      ],
    }),
    [labels, values, pointColors, title]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(0,0,0,0.8)",
          borderColor: "rgba(16,185,129,0.5)",
          borderWidth: 1,
          titleColor: "#a7f3d0",
          bodyColor: "#a7f3d0",
          displayColors: false,
        },
      },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            display: false,
            showLabelBackdrop: false,
            color: "rgba(110,231,183,0.75)",
            backdropColor: "transparent",
            font: { size: 10 },
          },
          grid: {
            color: "rgba(34,197,94,0.25)",
            circular: true,
          },
          angleLines: { color: "rgba(6,182,212,0.25)" },
          pointLabels: {
            color: "rgba(110,231,183,0.85)",
            font: { size: 10, family: "ui-monospace, SFMono-Regular, Menlo, monospace" },
          },
        },
      },
    }),
    []
  );

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-emerald-600/25 bg-black/30 p-2">
      <Radar data={data} options={options} />
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-emerald-500/10" />
    </div>
  );
}
