export function ContactSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="ios-surface-strong rounded-[2rem] p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-6">
            <div>
              <p className="ios-kicker">Contact</p>
              <h2 className="ios-title mt-2 text-2xl font-bold sm:text-3xl">Discutons de votre projet d edition spirituelle</h2>
              <p className="ios-muted mt-3 max-w-xl">
                Parlons de votre projet. Que vous ayez un manuscrit ou une idee, nous sommes la pour vous accompagner.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Coordonnees</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">+243 814 233 151</p>
                <p>contact@holistique-book.com</p>
                <p>Immeuble 130, Avenue Kwango, Kinshasa/Gombe</p>
              </div>
            </div>
          </div>

          <form className="ios-surface space-y-4 rounded-[2rem] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nom complet</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Votre nom"
                  className="ios-input w-full rounded-2xl px-4 py-3"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="vous@exemple.com"
                  className="ios-input w-full rounded-2xl px-4 py-3"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type de projet</label>
              <select name="projectType" className="ios-input w-full rounded-2xl px-4 py-3">
                <option value="">Selectionner</option>
                <option value="manuscript">Manuscrit termine</option>
                <option value="idea">Idee de livre</option>
                <option value="publishing">Edition et diffusion</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Votre message</label>
              <textarea
                name="message"
                rows={5}
                placeholder="Decrivez votre projet..."
                className="ios-input w-full rounded-2xl px-4 py-3"
                required
              />
            </div>
            <button type="submit" className="ios-button-primary w-full rounded-2xl px-4 py-3 text-sm font-semibold">
              Envoyer la demande
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
