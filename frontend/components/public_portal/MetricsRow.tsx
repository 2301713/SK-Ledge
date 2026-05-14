import { Layers, TrendingUp, CheckCircle2, Wallet } from "lucide-react";
import MetricCard from "./MetricCard";

export default function MetricsRow() {
  return (
    <section className="px-6 mb-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Projects"
          value="24"
          sub="Cycle 2023–2024"
          accent="bg-primary"
          icon={<Layers className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          label="Ongoing"
          value="8"
          sub="Execution phase"
          valueColor="text-ongoing"
          accent="bg-ongoing"
          icon={<TrendingUp className="w-4 h-4 text-ongoing" />}
        />
        <MetricCard
          label="Completed"
          value="13"
          sub="Validated records"
          valueColor="text-success"
          accent="bg-success"
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
        />
        <MetricCard
          label="Total ABYIP Budget"
          value="₱4.2M"
          sub="Annual Allocation"
          accent="bg-tertiary"
          icon={<Wallet className="w-4 h-4 text-tertiary" />}
        />
      </div>
    </section>
  );
}
