import { MessageCircle, ShieldCheck, Zap } from "lucide-react";

const items = [
  {
    title: "Acces instantane",
    description: "Lecture immediate sur mobile, tablette et desktop.",
    icon: Zap,
  },
  {
    title: "Paiement securise",
    description: "Mobile Money, cartes bancaires et confirmations rapides.",
    icon: ShieldCheck,
  },
  {
    title: "Support local 24/7",
    description: "Assistance humaine et reponse rapide en Afrique.",
    icon: MessageCircle,
  },
];

export function TrustIndicators() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="ios-surface ios-card-hover rounded-[1.5rem] p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100/70 text-rose-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="ios-title text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
