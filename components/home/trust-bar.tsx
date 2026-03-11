import { CreditCard, Lock, Wifi } from "lucide-react";

export function TrustBar() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="ios-surface mt-4 rounded-full px-4 py-2 text-xs text-slate-700 sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-600" />
            Paiements securises (Mobile Money & Cards)
          </span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="inline-flex items-center gap-2">
            <Wifi className="h-4 w-4 text-rose-600" />
            Lisez partout, meme hors-ligne
          </span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-rose-600" />
            +500 auteurs africains certifies
          </span>
        </div>
      </div>
    </div>
  );
}
