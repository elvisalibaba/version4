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
      aria-label={label ?? "Se déconnecter"}
    >
      <LogOut
        className={`h-4 w-4 transition-transform duration-300 ${
          pending ? "animate-pulse" : "group-hover:-translate-x-0.5"
        }`}
      />
      {compact ? null : (
        <span className="transition-colors duration-300">
          {pending ? "Déconnexion..." : label ?? "Se déconnecter"}
        </span>
      )}
    </button>
  );
}

export function LogoutButton({
  className = "group inline-flex h-11 items-center justify-center gap-2.5 rounded-full border border-[#e5ddd2] bg-white px-5 text-sm font-semibold text-[#26221d] shadow-sm transition-all duration-300 hover:border-[#c9bfb2] hover:bg-[#faf8f4] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
  compact = false,
  label,
}: LogoutButtonProps) {
  return (
    <form action={signOutAction} className="inline-block">
      <LogoutButtonInner className={className} compact={compact} label={label} />
    </form>
  );
}