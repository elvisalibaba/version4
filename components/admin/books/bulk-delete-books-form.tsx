"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminBooksAction } from "@/app/admin/actions";

export function BulkDeleteBooksForm({ children, count }: { children: React.ReactNode; count: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  function updateCount() {
    const selected = formRef.current?.querySelectorAll<HTMLInputElement>('input[name="book_ids"]:checked').length ?? 0;
    setSelectedCount(selected);
  }

  function toggleAll(checked: boolean) {
    formRef.current?.querySelectorAll<HTMLInputElement>('input[name="book_ids"]').forEach((input) => {
      input.checked = checked;
    });
    updateCount();
  }

  return (
    <form
      ref={formRef}
      action={deleteAdminBooksAction}
      onChange={updateCount}
      onSubmit={(event) => {
        if (!selectedCount || !window.confirm(`Supprimer définitivement ${selectedCount} livre${selectedCount > 1 ? "s" : ""} ? Cette action est irréversible.`)) {
          event.preventDefault();
        }
      }}
    >
      <div className="flex flex-col gap-3 border-b border-[#e8dfd2] bg-[#fffaf2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-[#173d2c]">
          <input
            type="checkbox"
            aria-label="Sélectionner tous les livres de cette page"
            className="h-5 w-5 rounded border-[#b9ad9c] accent-[#173d2c]"
            onChange={(event) => toggleAll(event.currentTarget.checked)}
          />
          Sélectionner les {count} livres de cette page
        </label>
        <button
          type="submit"
          disabled={!selectedCount}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#9f352c] px-4 text-sm font-bold text-white transition hover:bg-[#842b24] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          {selectedCount ? `Supprimer (${selectedCount})` : "Supprimer la sélection"}
        </button>
      </div>
      {children}
    </form>
  );
}
