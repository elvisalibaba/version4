import type { AdminChartDatum } from "@/types/admin";

type SimpleBarChartProps = {
  data: AdminChartDatum[];
  emptyLabel?: string;
};

export function SimpleBarChart({ data, emptyLabel = "Aucune donnee disponible." }: SimpleBarChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 font-semibold text-slate-950">
              {item.value}
              {item.suffix ?? ""}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-violet-50">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7d65ff,#ff9c81)]"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
