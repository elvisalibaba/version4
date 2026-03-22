"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/actions/auth";

type LogoutButtonProps = {
  className?: string;
  compact?: boolean;
  label?: string;
};

function LogoutButtonInner({ className, compact, label }: LogoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      aria-label={label ?? "Se deconnecter"}
    >
      <LogOut className="h-4 w-4" />
      {compact ? null : <span>{pending ? "Deconnexion..." : label ?? "Se deconnecter"}</span>}
    </button>
  );
}

export function LogoutButton({
  className = "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d7d0c5] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#b8aea0] hover:bg-[#f8f6f2] disabled:cursor-not-allowed disabled:opacity-70",
  compact = false,
  label,
}: LogoutButtonProps) {
  return (
    <form action={signOutAction}>
      <LogoutButtonInner className={className} compact={compact} label={label} />
    </form>
  );
}
