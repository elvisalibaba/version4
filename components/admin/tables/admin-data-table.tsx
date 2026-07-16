import type { ReactNode } from "react";

type AdminDataTableProps = {
  columns: ReactNode[];
  children: ReactNode;
};

export function AdminDataTable({ columns, children }: AdminDataTableProps) {
  return (
    <div className="overflow-x-auto rounded-[1.7rem] border border-violet-200/70 bg-white/94 shadow-[0_18px_40px_rgba(89,68,219,0.08)]">
      <table className="min-w-full border-collapse">
        <thead className="bg-violet-50/80">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
