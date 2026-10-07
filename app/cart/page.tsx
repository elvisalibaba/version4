import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getCurrentUserProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panier",
  robots: { index: false },
};

function splitName(profile: { first_name: string | null; last_name: string | null; name: string | null }) {
  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";
  if (firstName && lastName) return { firstName, lastName };
  const parts = (profile.name?.trim() ?? "").split(/\s+/).filter(Boolean);
  return { firstName: firstName || parts[0] || "", lastName: lastName || parts.slice(1).join(" ") };
}

export default async function CartPage() {
  const profile = await getCurrentUserProfile();
  const names = profile ? splitName(profile) : null;

  return (
    <div className="hb-fullbleed bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CartView
          isAuthenticated={Boolean(profile)}
          customer={
            profile
              ? {
                  customerId: profile.id,
                  firstName: names?.firstName ?? null,
                  lastName: names?.lastName ?? null,
                  email: profile.email,
                  phoneNumber: profile.phone,
                  city: profile.city,
                  country: profile.country,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
