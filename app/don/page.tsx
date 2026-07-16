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
    <section className="bg-[#eaeded]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-[760px] space-y-4">
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

          <div className="rounded-2xl border border-[#d5d9d9] bg-white px-5 py-4 text-sm leading-6 text-[#565959] shadow-sm">
            {profile ? (
              <p>Votre session est active. Les champs disponibles sont deja pre-remplis avec votre profil.</p>
            ) : (
              <p>
                Vous pouvez faire un don sans compte, mais la connexion facilite le pre-remplissage.{" "}
                <Link href={loginHref} className="font-semibold text-[#007185] transition hover:text-[#c7511f] hover:underline">
                  Se connecter
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
