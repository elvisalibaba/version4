import type { AdminOption } from "@/types/admin";

type AdminSelectProps = {
  name: string;
  label: string;
  defaultValue?: string;
  options: AdminOption[];
  placeholder?: string;
  className?: string;
};

export function AdminSelect({
  name,
  label,
  defaultValue,
  options,
  placeholder = "Tous",
  className = "",
}: AdminSelectProps) {
  return (
    <label className={`grid min-w-[180px] gap-2 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
