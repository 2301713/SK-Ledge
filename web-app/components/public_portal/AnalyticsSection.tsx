"use client";

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
import { chartColors } from "../../app/public_portal/data";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

export default function AnalyticsSection() {
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
                labels: [
                  "Youth Dev",
                  "Sports",
                  "Health",
                  "Livelihood",
                  "Env",
                  "Peace",
                  "Arts",
                ],
                datasets: [
                  {
                    data: [1, 2, 2, 1, 1, 1, 1],
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
                labels: ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "Q1 2024"],
                datasets: [
                  {
                    label: "Disbursed (₱)",
                    data: [320000, 480000, 610000, 890000, 600000],
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
