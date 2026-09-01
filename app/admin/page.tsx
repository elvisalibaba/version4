import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, CircleDollarSign, ShoppingCart, Users } from "lucide-react";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { formatMoney } from "@/lib/book-offers";
import { getAdminDashboardData } from "@/lib/supabase/admin/dashboard";
import { formatAdminDateTime, formatCompactNumber } from "@/lib/supabase/admin/shared";

const quickLinks = [
  { label: "Vérifier les livres", href: "/admin/books", icon: ClipboardCheck, description: "Valider les nouvelles publications" },
  { label: "Voir les commandes", href: "/admin/orders", icon: ShoppingCart, description: "Suivre les paiements et livraisons" },
  { label: "Gérer les auteurs", href: "/admin/authors", icon: Users, description: "Consulter les espaces auteurs" },
  { label: "Mettre en avant", href: "/admin/home-positioning", icon: BookOpen, description: "Choisir les contenus de l’accueil" },
];

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof getAdminDashboardData>>;
  try {
    data = await getAdminDashboardData();
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center"><h1 className="font-serif text-2xl text-[#17231d]">Impossible de charger les informations</h1><p className="mt-2 text-sm text-[#766e64]">Veuillez réessayer dans quelques instants.</p></div>;
  }

  const stats = [
    { label: "Livres", value: formatCompactNumber(data.totals.books), detail: `${data.totals.publishedBooks} publiés`, icon: BookOpen },
    { label: "À vérifier", value: formatCompactNumber(data.totals.submittedBooks), detail: "Livres envoyés par les auteurs", icon: ClipboardCheck },
    { label: "Commandes", value: formatCompactNumber(data.totals.orders), detail: `${data.totals.pendingOrders} en attente`, icon: ShoppingCart },
    { label: "Revenus", value: data.totals.revenueLabel, detail: "Paiements confirmés", icon: CircleDollarSign },
    { label: "Utilisateurs", value: formatCompactNumber(data.totals.users), detail: `${data.totals.authors} auteurs · ${data.totals.readers} lecteurs`, icon: Users },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-[30px] bg-[#173d2c] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[58px] border-[#e8ac42]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Administration Holistique Books</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Vue d’ensemble</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Les informations importantes et les tâches à traiter aujourd’hui.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/books" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c]">Gérer les livres<ArrowRight className="h-4 w-4" /></Link><Link href="/home" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-bold">Voir le site</Link></div>
        </div>
      </header>

      {data.notices.length ? <div className="grid gap-3 md:grid-cols-2">{data.notices.map((notice) => <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />)}</div> : null}

      <section aria-label="Indicateurs principaux" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="rounded-2xl border border-[#ded3c2] bg-white p-4 sm:p-5"><Icon className="h-5 w-5 text-[#b85135]" /><p className="mt-4 break-words text-2xl font-bold text-[#17231d]">{stat.value}</p><p className="mt-1 text-sm font-bold text-[#403a34]">{stat.label}</p><p className="mt-1 text-xs leading-5 text-[#837a70]">{stat.detail}</p></article>; })}
      </section>

      <section><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a94b34]">Accès rapide</p><h2 className="mt-2 font-serif text-2xl text-[#17231d]">Que souhaitez-vous gérer ?</h2></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickLinks.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="group rounded-2xl border border-[#ded3c2] bg-[#fffaf2] p-5 transition hover:-translate-y-0.5 hover:border-[#bda98d] hover:shadow-lg"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#173d2c] text-[#f2c66f]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-bold text-[#17231d]">{item.label}</h3><p className="mt-1 text-sm leading-5 text-[#766e64]">{item.description}</p></Link>; })}</div></section>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[28px] border border-[#ded3c2] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a94b34]">Priorité</p><h2 className="mt-2 font-serif text-2xl text-[#17231d]">Livres à vérifier</h2></div><Link href="/admin/books" className="text-sm font-bold text-[#a94b34]">Tout voir</Link></div>
          <div className="mt-5 divide-y divide-[#e8dfd2]">{data.recentSubmittedBooks.slice(0, 6).map((book) => <article key={book.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="truncate font-bold text-[#17231d]">{book.title}</h3><p className="mt-1 text-xs text-[#837a70]">{book.author_name} · envoyé le {formatAdminDateTime(book.submitted_at)}</p></div><div className="flex items-center gap-3"><StatusBadge kind="review" value={book.review_status} /><Link href={`/admin/books/${book.id}`} className="inline-flex h-9 items-center rounded-full border border-[#d9cebd] px-3 text-xs font-bold">Ouvrir</Link></div></article>)}{!data.recentSubmittedBooks.length ? <p className="py-12 text-center text-sm text-[#766e64]">Aucun livre en attente de vérification.</p> : null}</div>
        </section>

        <section className="rounded-[28px] border border-[#ded3c2] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a94b34]">Commerce</p><h2 className="mt-2 font-serif text-2xl text-[#17231d]">Dernières commandes</h2></div><Link href="/admin/orders" className="text-sm font-bold text-[#a94b34]">Tout voir</Link></div>
          <div className="mt-5 divide-y divide-[#e8dfd2]">{data.recentOrders.slice(0, 6).map((order) => <article key={order.id} className="flex items-center justify-between gap-4 py-4 first:pt-0"><div className="min-w-0"><Link href={`/admin/orders/${order.id}`} className="font-bold text-[#17231d]">Commande {order.id.slice(0, 8)}</Link><p className="mt-1 truncate text-xs text-[#837a70]">{order.user_name} · {order.itemCount} article{order.itemCount > 1 ? "s" : ""}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-[#17231d]">{formatMoney(order.total_price, order.currency_code)}</p><div className="mt-1"><StatusBadge kind="payment" value={order.payment_status} /></div></div></article>)}{!data.recentOrders.length ? <p className="py-12 text-center text-sm text-[#766e64]">Aucune commande récente.</p> : null}</div>
        </section>
      </div>

      <section className="rounded-[28px] bg-[#102d21] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f2c66f]">Catalogue</p><h2 className="mt-2 font-serif text-2xl">Livres les plus consultés</h2></div></div><div className="mt-5 grid gap-3 md:grid-cols-3">{data.topViewedBooks.slice(0, 3).map((book, index) => <Link key={book.id} href={`/admin/books/${book.id}`} className="rounded-2xl bg-white/[.07] p-4 hover:bg-white/[.1]"><span className="text-xs font-bold text-[#f2c66f]">#{index + 1}</span><h3 className="mt-3 truncate font-bold">{book.title}</h3><p className="mt-1 truncate text-xs text-white/55">{book.author_name}</p><p className="mt-4 text-sm font-bold">{formatCompactNumber(book.views_count)} vues</p></Link>)}</div></section>
    </div>
  );
}
