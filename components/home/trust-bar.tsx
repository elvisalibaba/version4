import { CreditCard, Lock, Wifi } from "lucide-react";

export function TrustBar() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="ios-surface mt-4 rounded-full px-4 py-2 text-xs text-slate-700 sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-600" />
            Paiement simple et securise
          </span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="inline-flex items-center gap-2">
            <Wifi className="h-4 w-4 text-rose-600" />
            Lisez partout, a votre rythme
          </span>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-rose-600" />
            Livres pour grandir et se recentrer
          </span>
        </div>
      </div>
    </div>
  );
}
