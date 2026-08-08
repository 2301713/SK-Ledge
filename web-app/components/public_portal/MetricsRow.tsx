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
    <section className="px-6 mb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Projects"
          value={String(total)}
          sub="All barangay records"
          accent="bg-primary"
          icon={<Layers className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          label="Approved"
          value={String(approved)}
          sub="Approved proposals"
          valueColor="text-success"
          accent="bg-success"
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
        />
        <MetricCard
          label="Pending"
          value={String(pending)}
          sub="Awaiting approval"
          valueColor="text-pending"
          accent="bg-pending"
          icon={<Clock className="w-4 h-4 text-pending" />}
        />
        <MetricCard
          label="Total Proposed Budget"
          value={formatBudget(totalBudget)}
          sub="Across all projects"
          accent="bg-tertiary"
          icon={<Wallet className="w-4 h-4 text-tertiary" />}
        />
      </div>
    </section>
  );
}
