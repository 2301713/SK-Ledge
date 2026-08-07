"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type Chart,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { BRAND } from "./chartColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface AccountsBarChartProps {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  unit?: string;
  className?: string;
}

function makeHatch(ctx: CanvasRenderingContext2D) {
  const size = 7;
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const g = offscreen.getContext("2d");
  if (!g) return "#E2E8F0";
  g.fillStyle = "#F8FAFC";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "#CBD5E1";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-size, size);
  g.lineTo(size, -size);
  g.stroke();
  return ctx.createPattern(offscreen, "repeat") ?? "#E2E8F0";
}

export default function AccountsBarChart({
  data,
  highlightIndex = -1,
  unit = "accounts",
  className = "",
}: AccountsBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const highlightLabelPlugin = {
    id: "highlightLabel",
    afterDatasetsDraw(chart: Chart<"bar">) {
      if (highlightIndex < 0) return;
      const meta = chart.getDatasetMeta(0);
      const bar = meta.data[highlightIndex];
      if (!bar) return;

      const value = data[highlightIndex]?.value ?? 0;
      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
      const label = `${pct}%`;
      const x = bar.x;
      const y = bar.y;

      const { ctx } = chart;
      ctx.save();
      ctx.font = "700 12px Inter, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const width = textWidth + 18;
      const height = 24;
      const top = y - height - 12;
      const left = x - width / 2;

      ctx.fillStyle = BRAND;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(left, top, width, height, 8);
      } else {
        ctx.rect(left, top, width, height);
      }
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - 4, top + height);
      ctx.lineTo(x + 4, top + height);
      ctx.lineTo(x, top + height + 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, top + height / 2 + 0.5);
      ctx.restore();
    },
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: "#0F172A",
        padding: 10,
        cornerRadius: 10,
        titleFont: { weight: 700 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => `${context.parsed.y} ${unit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94A3B8", font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#E2E8F0" },
        border: { display: false },
        ticks: {
          color: "#94A3B8",
          font: { size: 12 },
          precision: 0,
        },
      },
    },
  };

  return (
    <div className={`h-64 w-full ${className}`}>
      <Bar
        data={{
          labels: data.map((item) => item.label),
          datasets: [
            {
              data: data.map((item) => item.value),
              barThickness: 30,
              borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
              backgroundColor: (context) =>
                context.dataIndex === highlightIndex
                  ? BRAND
                  : makeHatch(context.chart.ctx),
            },
          ],
        }}
        options={options}
        plugins={[highlightLabelPlugin]}
      />
    </div>
  );
}
