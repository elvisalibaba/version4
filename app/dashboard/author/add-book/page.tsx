import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthorBookImportForm } from "@/components/author/author-book-import-form";
import { requireRole } from "@/lib/auth";
import { getAuthorProfile, getSubscriptionPlans } from "@/lib/author-api";

export default async function AddBookPage() {
  const profile = await requireRole(["author"]);
  const [authorProfile, subscriptionPlans] = await Promise.all([
    getAuthorProfile(),
    getSubscriptionPlans(),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-[28px] bg-[#173d2c] p-6 text-white sm:p-8">
        <Link href="/dashboard/author/books" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Mes livres
        </Link>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Nouvelle publication</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Ajouter jusqu’à trois livres</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
          PDF et EPUB sont envoyés vers le stockage privé Laravel. La couverture peut être fournie ou générée depuis la première page.
        </p>
      </header>

      <div className="rounded-[28px] border border-[#ded3c2] bg-white p-4 sm:p-6">
        <AuthorBookImportForm
          subscriptionPlans={subscriptionPlans}
          initialValues={{
            authorFullName: authorProfile.display_name || profile.name || "",
          }}
        />
      </div>
    </section>
  );
}
