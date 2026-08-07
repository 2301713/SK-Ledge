"use client";

import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

export interface GaugeSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutGaugeProps {
  segments: GaugeSegment[];
  centerValue: string;
  centerLabel?: string;
  className?: string;
}

export default function DonutGauge({
  segments,
  centerValue,
  centerLabel,
  className = "",
}: DonutGaugeProps) {
  const hasData = segments.some((segment) => segment.value > 0);

  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="relative h-44 w-44">
        <Doughnut
          data={{
            labels: segments.map((segment) => segment.label),
            datasets: [
              {
                data: hasData
                  ? segments.map((segment) => segment.value)
                  : [1],
                backgroundColor: hasData
                  ? segments.map((segment) => segment.color)
                  : ["#E2E8F0"],
                borderWidth: 0,
                hoverOffset: 4,
                spacing: 2,
                borderRadius: 8,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "76%",
            plugins: {
              legend: { display: false },
              tooltip: { enabled: hasData },
            },
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight text-primary-foreground">
            {centerValue}
          </span>
          {centerLabel && (
            <span className="mt-0.5 text-xs font-medium text-secondary-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs font-medium text-secondary-foreground">
              {segment.label}
            </span>
            <span className="text-xs font-bold text-primary-foreground">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
