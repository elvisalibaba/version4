import Link from "next/link";
import nodemailer from "nodemailer";

async function sendAuthorRequest(formData: FormData) {
  "use server";

  const name = String(formData.get("authorName") ?? "").trim();
  const email = String(formData.get("authorEmail") ?? "").trim();
  const message = String(formData.get("authorMessage") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();

  if (company) return;
  if (!name || !email || !message) return;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration missing.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const to = process.env.CONTACT_TO ?? "elvisalibaba@gmail.com";
  const from = process.env.SMTP_FROM ?? `Holistique Books <${user}>`;

  const content = [
    `Nom: ${name}`,
    `Email: ${email}`,
    "",
    "Projet:",
    message,
  ].join("\n");

  await transporter.sendMail({
    to,
    from,
    subject: "Demande de rendez-vous auteur",
    text: content,
  });
}

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-amber-400/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#100d0b] shadow-2xl shadow-black/20 sm:rounded-[2.5rem]">
          {/* Texture décorative */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_35%)]" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)",
                backgroundSize: "42px 42px",
              }}
            />

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/10" />
          </div>

          <div className="grid gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:px-16 lg:py-16">
            {/* Contenu */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
                Publier avec Holistique Books
              </div>

              <h2 className="mt-6 text-balance text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Prêt à publier votre livre ou à découvrir de nouvelles œuvres ?
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                Rejoignez une maison d’édition moderne qui accompagne les
                auteurs de la conception du manuscrit jusqu’à sa publication,
                sa diffusion et sa promotion.
              </p>

              <div className="mt-8 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                    01
                  </span>
                  <p className="font-medium text-white">Édition structurée</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Un parcours clair pour chaque manuscrit.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                    02
                  </span>
                  <p className="font-medium text-white">Publication moderne</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Une identité éditoriale professionnelle.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                    03
                  </span>
                  <p className="font-medium text-white">Visibilité renforcée</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Une stratégie adaptée à votre ouvrage.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-stone-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[0_16px_40px_-16px_rgba(252,211,77,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100d0b]"
                >
                  Créer mon compte auteur

                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>

                <Link
                  href="/librairie"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100d0b]"
                >
                  Explorer la librairie
                </Link>
              </div>
            </div>

            {/* Formulaire */}
            <div className="relative">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-300/15 via-white/5 to-violet-500/10 blur-2xl" />

              <form
                action={sendAuthorRequest}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.075] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                      Espace auteur
                    </p>

                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      Parlez-nous de votre projet
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                      Recevez un plan d’édition, un calendrier de publication et
                      une proposition d’accompagnement.
                    </p>
                  </div>

                  <div
                    aria-hidden="true"
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-amber-200 sm:flex"
                  >
                    ✦
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div className="space-y-2">
                    <label
                      htmlFor="authorName"
                      className="text-xs font-medium text-white/70"
                    >
                      Nom complet
                    </label>

                    <input
                      id="authorName"
                      type="text"
                      name="authorName"
                      placeholder="Ex. Jean Mabiala"
                      autoComplete="name"
                      className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-amber-300/50 focus:bg-black/30 focus:ring-4 focus:ring-amber-300/10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="authorEmail"
                      className="text-xs font-medium text-white/70"
                    >
                      Adresse e-mail
                    </label>

                    <input
                      id="authorEmail"
                      type="email"
                      name="authorEmail"
                      placeholder="nom@exemple.com"
                      autoComplete="email"
                      className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-amber-300/50 focus:bg-black/30 focus:ring-4 focus:ring-amber-300/10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="authorMessage"
                      className="text-xs font-medium text-white/70"
                    >
                      Présentation du projet
                    </label>

                    <textarea
                      id="authorMessage"
                      name="authorMessage"
                      rows={4}
                      placeholder="Présentez votre livre, son sujet et l’étape actuelle du projet."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-amber-300/50 focus:bg-black/30 focus:ring-4 focus:ring-amber-300/10"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[0_18px_40px_-18px_rgba(252,211,77,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#201b17]"
                >
                  Demander un rendez-vous

                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>

                <p className="mt-4 text-center text-[11px] leading-5 text-white/35">
                  En soumettant ce formulaire, vous acceptez d’être contacté
                  concernant votre projet éditorial.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}