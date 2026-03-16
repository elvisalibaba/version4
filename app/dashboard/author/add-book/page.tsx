import Link from "next/link";
import { Library, WandSparkles } from "lucide-react";
import { PublishLabForm } from "@/components/author/publish-lab-form";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
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
      <DashboardTopbar
        kicker="Publishing lab"
        title="Ajouter un nouveau livre"
        description="Renseignez les metadonnees, importez les fichiers, proposez vos formats puis enregistrez le brouillon ou soumettez le livre a l admin pour validation."
        actions={
          <>
            <Link href="/dashboard/author/books" className="cta-primary px-5 py-3 text-sm">
              <Library className="h-4 w-4" />
              Retour au catalogue
            </Link>
            <Link href="/dashboard/author/sales" className="cta-secondary px-5 py-3 text-sm">
              <WandSparkles className="h-4 w-4" />
              Voir les ventes
            </Link>
          </>
        }
      />

      <div className="surface-panel p-4 sm:p-6">
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
