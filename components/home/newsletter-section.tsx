export function NewsletterSection() {
  return (
    <section className="hb-newsletter-banner">
      <div className="hb-section-shell">
        <div className="hb-newsletter-inner">
          <p className="hb-newsletter-title">SIGN UP FOR EXCLUSIVE SALES &amp; NEWS</p>
          <form className="hb-newsletter-form">
            <input type="email" name="email" placeholder="Your Email Address" className="hb-newsletter-input" required />
            <button type="submit" className="hb-newsletter-button">
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
