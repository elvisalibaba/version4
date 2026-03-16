export function NewsletterSection() {
  return (
    <section className="hb-newsletter-banner">
      <div className="hb-section-shell">
        <div className="hb-newsletter-inner">
          <div className="space-y-3">
            <p className="hb-newsletter-title">Recevez les meilleures lectures pour grandir, guerir et passer a l action.</p>
            <p className="hb-newsletter-copy">
              Nouveautes, offres utiles et selections de livres transformationnels directement dans votre boite mail.
            </p>
          </div>
          <form className="hb-newsletter-form">
            <input type="email" name="email" placeholder="Votre adresse email" className="hb-newsletter-input" required />
            <button type="submit" className="hb-newsletter-button">
              Je m inscris
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
