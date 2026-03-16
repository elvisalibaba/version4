import { Search } from "lucide-react";

type SearchBarProps = {
  action?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  buttonLabel?: string;
  compact?: boolean;
  className?: string;
};

export function SearchBar({
  action = "/books",
  name = "q",
  defaultValue,
  placeholder = "Rechercher un livre, un auteur ou une categorie",
  buttonLabel = "Search",
  compact = false,
  className = "",
}: SearchBarProps) {
  return (
    <form action={action} className={`search-field ${compact ? "search-field-compact" : ""} ${className}`.trim()}>
      <Search className="h-4 w-4 text-violet-500" />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      <button type="submit" className={compact ? "cta-secondary px-4 py-2 text-xs" : "cta-primary px-4 py-2 text-xs"}>
        {buttonLabel}
      </button>
    </form>
  );
}
