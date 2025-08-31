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

type Props = {
  title?: string;
  // Expect 0–100 values; we’ll normalize with each dim’s min/max if provided.
  dims: { label: string; value: number; min?: number; max?: number }[];
};

export default function NeonRadar({ title = "personality", dims }: Props) {
  const { labels, values } = useMemo(() => {
    const labels = dims.map((d) => d.label.replace(/_/g, " "));
    const values = dims.map((d) => {
      const min = d.min ?? 0;
      const max = d.max ?? 100;
      const v = Math.max(min, Math.min(max, d.value ?? 0));
      return ((v - min) / (max - min || 1)) * 100; // normalize to 0–100
    });
    return { labels, values };
  }, [dims]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: title,
        data: values,
        borderColor: "rgba(34,211,238,0.9)",     // cyan
        backgroundColor: "rgba(16,185,129,0.18)", // emerald fill
        borderWidth: 2,
        pointRadius: 2.6,
        pointBackgroundColor: "rgba(34,211,238,1)",
        pointBorderColor: "rgba(16,185,129,1)",
        pointHoverRadius: 4,
        fill: true,
        tension: 0.25,
      },
    ],
  }), [labels, values, title]);

  const options = useMemo(() => ({
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
          color: "rgba(110,231,183,0.75)", // emerald-300
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: {
          color: "rgba(34,197,94,0.25)",    // emerald-500/25
          circular: true,
        },
        angleLines: { color: "rgba(6,182,212,0.25)" }, // cyan-500/25
        pointLabels: {
          color: "rgba(110,231,183,0.85)",
          font: { size: 10, family: "ui-monospace, SFMono-Regular, Menlo, monospace" },
        },
      },
    },
  }), []);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-emerald-600/25 bg-black/30 p-2">
      <Radar data={data} options={options} />
      {/* soft neon ring */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-emerald-500/10" />
    </div>
  );
}
