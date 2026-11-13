import { Layers, CheckCircle2, Clock, Wallet } from "lucide-react";
import MetricCard from "./MetricCard";

type Project = {
  budget?: number | string;
  amount?: number | string;
  status?: string;
};

const formatBudget = (value: number) => {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  }
  return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function MetricsRow({ projects }: { projects: Project[] }) {
  const total = projects.length;
  const approved = projects.filter((p) => p.status === "Approved").length;
  const pending = projects.filter((p) => p.status === "Pending").length;
  const totalBudget = projects.reduce((sum, p) => {
    const raw = p.budget ?? p.amount ?? 0;
    const num = typeof raw === "number" ? raw : parseFloat(raw.replace(/[₱,\s]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <section className="mb-8 px-4 sm:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Projects"
          value={String(total)}
          sub="All barangay records"
          accent="bg-primary"
          icon={<Layers className="w-4 h-4 text-primary" />}
          delayMs={0}
        />
        <MetricCard
          label="Approved"
          value={String(approved)}
          sub="Approved proposals"
          valueColor="text-success"
          accent="bg-success"
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          delayMs={60}
        />
        <MetricCard
          label="Pending"
          value={String(pending)}
          sub="Awaiting approval"
          valueColor="text-pending"
          accent="bg-pending"
          icon={<Clock className="w-4 h-4 text-pending" />}
          delayMs={120}
        />
        <MetricCard
          label="Total Proposed Budget"
          value={formatBudget(totalBudget)}
          sub="Across all projects"
          accent="bg-tertiary"
          icon={<Wallet className="w-4 h-4 text-tertiary" />}
          delayMs={180}
        />
      </div>
    </section>
  );
}
