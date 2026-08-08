"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const chartColors = [
  "#0138A8",
  "#FBD219",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
];

type Project = {
  category?: string;
  budget?: number | string;
  amount?: number | string;
};

type Disbursement = {
  amount: number;
  created_at?: string;
};

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.replace(/[₱,\s]/g, ""));
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export default function AnalyticsSection({
  projects,
  disbursements,
}: {
  projects: Project[];
  disbursements: Disbursement[];
}) {
  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of projects) {
      const cat = p.category || "General";
      totals.set(cat, (totals.get(cat) || 0) + toNumber(p.budget ?? p.amount));
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(([label]) => label),
      data: sorted.map(([, value]) => value),
    };
  }, [projects]);

  const quarterData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of disbursements) {
      const date = d.created_at ? new Date(d.created_at) : null;
      if (!date || isNaN(date.getTime())) continue;
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      totals.set(quarter, (totals.get(quarter) || 0) + toNumber(d.amount));
    }
    const sorted = [...totals.entries()].sort((a, b) => {
      const [qa, ya] = a[0].split(" ");
      const [qb, yb] = b[0].split(" ");
      return (
        Number(ya) - Number(yb) || Number(qa.slice(1)) - Number(qb.slice(1))
      );
    });
    return {
      labels: sorted.map(([label]) => label),
      data: sorted.map(([, value]) => value),
    };
  }, [disbursements]);

  return (
    <section className="px-4 sm:px-6 mb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="lg:col-span-1 rounded-3xl border border-border bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.15em] mb-1">
              Analytics
            </p>
            <h3 className="text-base font-bold text-primary-foreground">
              Fund Distribution
            </h3>
          </div>
          <div className="h-64">
            <Pie
              data={{
                labels: categoryData.labels,
                datasets: [
                  {
                    data: categoryData.data,
                    backgroundColor: chartColors,
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      padding: 16,
                      color: "#64748B",
                      font: { size: 10, weight: "bold" },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.10)]">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-secondary-foreground uppercase tracking-[0.15em] mb-1">
              Analytics
            </p>
            <h3 className="text-base font-bold text-primary-foreground">
              Disbursement Trend (Quarterly)
            </h3>
          </div>
          <div className="h-64">
            <Bar
              data={{
                labels: quarterData.labels,
                datasets: [
                  {
                    label: "Disbursed (₱)",
                    data: quarterData.data,
                    backgroundColor: "#0138A8",
                    hoverBackgroundColor: "#FBD219",
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    titleColor: "#94a3b8",
                    bodyColor: "#ffffff",
                    padding: 12,
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#64748B", font: { size: 11 } },
                    border: { display: false },
                  },
                  y: {
                    grid: { color: "rgba(15,23,42,0.06)" },
                    ticks: { color: "#64748B", font: { size: 11 } },
                    border: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
