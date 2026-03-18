import Link from "next/link";
import { CinetPayDonateForm } from "@/components/payments/cinetpay-donate-form";
import { getCurrentUserProfile } from "@/lib/auth";

function deriveCheckoutNames(profile: {
  first_name: string | null;
  last_name: string | null;
  name: string | null;
}) {
  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";

  if (firstName && lastName) {
    return { firstName, lastName };
  }

  const fallbackName = profile.name?.trim() ?? "";
  const fallbackParts = fallbackName ? fallbackName.split(/\s+/).filter(Boolean) : [];

  return {
    firstName: firstName || fallbackParts[0] || "",
    lastName: lastName || fallbackParts.slice(1).join(" ") || "",
  };
}

export default async function DonatePage() {
  const profile = await getCurrentUserProfile();
  const checkoutIdentity = profile ? deriveCheckoutNames(profile) : null;
  const loginHref = `/login?next=${encodeURIComponent("/don")}`;

  return (
    <section className="page-hero-shell space-y-8 py-12">
      <div className="surface-panel space-y-6 p-8">
        <div className="rounded-[1.6rem] border border-violet-100 bg-violet-50/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Soutien Holistique Books</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Faire un don</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Utilisez votre moyen de paiement CinetPay pour soutenir la plateforme. Le statut de transaction est verifie cote serveur avant confirmation.
          </p>
        </div>

        <CinetPayDonateForm
          defaultCustomer={
            profile
              ? {
                  customerId: profile.id,
                  firstName: checkoutIdentity?.firstName ?? null,
                  lastName: checkoutIdentity?.lastName ?? null,
                  email: profile.email,
                  phoneNumber: profile.phone,
                  city: profile.city,
                  country: profile.country,
                }
              : null
          }
        />

        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-sm text-slate-600">
          {profile ? (
            <p>Votre session est active. Les champs sont pre-remplis avec votre profil quand les donnees sont disponibles.</p>
          ) : (
            <p>
              Vous pouvez faire un don sans compte, mais la connexion facilite le pre-remplissage.
              {" "}
              <Link href={loginHref} className="font-semibold text-violet-700 hover:text-violet-800">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
