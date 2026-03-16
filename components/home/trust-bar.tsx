import { BookOpen, CreditCard, Smartphone } from "lucide-react";

export function TrustBar() {
  const items = [
    {
      icon: BookOpen,
      title: "Livres inspires",
      description: "Choisissez parmi des ebooks et livres classes pour entrer vite dans la bonne lecture.",
    },
    {
      icon: Smartphone,
      title: "Lecture web et mobile",
      description: "Reprenez vos titres simplement sur le web et preparez la suite sur mobile.",
    },
    {
      icon: CreditCard,
      title: "Paiement securise",
      description: "Achetez vos livres et vos acces premium dans une experience sobre et rassurante.",
    },
  ];

  return (
    <section className="hb-section hb-template-benefits-section">
      <div className="hb-section-shell">
        <div className="hb-template-benefits">
          {items.map(({ icon: Icon, title, description }) => (
            <article key={title} className="hb-template-benefit">
              <span className="hb-template-benefit-icon">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="hb-template-benefit-title">{title}</h3>
                <p className="hb-template-benefit-text">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
