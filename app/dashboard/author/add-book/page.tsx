import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublishLabForm } from "@/components/author/publish-lab-form";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AuthorProfileRow = Pick<Database["public"]["Tables"]["author_profiles"]["Row"], "display_name">;
type SubscriptionPlanRow = Pick<
  Database["public"]["Tables"]["subscription_plans"]["Row"],
  "id" | "name" | "slug" | "description" | "monthly_price" | "currency_code" | "is_active"
>;

export default async function AddBookPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();

  const [{ data: authorProfileData }, { data: subscriptionPlans }] = await Promise.all([
    supabase.from("author_profiles").select("display_name").eq("id", profile.id).returns<AuthorProfileRow>().maybeSingle(),
    supabase
      .from("subscription_plans")
      .select("id, name, slug, description, monthly_price, currency_code, is_active")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true })
      .returns<SubscriptionPlanRow[]>(),
  ]);

  const authorProfile = (authorProfileData ?? null) as AuthorProfileRow | null;
  const authorFullName = authorProfile?.display_name ?? profile.name ?? "";

  return (
    <section className="space-y-6">
      <header className="rounded-[28px] bg-[#173d2c] p-6 text-white sm:p-8"><Link href="/dashboard/author/books" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Mes livres</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Nouvelle publication</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Ajouter un livre</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Renseignez les informations principales. Vous pourrez compléter le reste plus tard.</p></header>

      <div className="rounded-[28px] border border-[#ded3c2] bg-white p-4 sm:p-6">
        <PublishLabForm
          subscriptionPlans={(subscriptionPlans ?? []) as SubscriptionPlanRow[]}
          initialValues={{
            authorFullName,
          }}
        />
      </div>
    </section>
  );
}
