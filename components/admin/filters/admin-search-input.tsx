type AdminSearchInputProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
};

export function AdminSearchInput({
  name = "q",
  label = "Recherche",
  placeholder = "Rechercher",
  defaultValue,
  className = "",
}: AdminSearchInputProps) {
  return (
    <label className={`grid min-w-[220px] gap-2 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
      />
    </label>
  );
}
