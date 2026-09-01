import Link from "next/link";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { BOOK_FORMATS, getBookFormatLabel } from "@/lib/book-formats";
import { formatMoney } from "@/lib/book-offers";
import { listAdminOrders } from "@/lib/supabase/admin/orders";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type Props = { searchParams: Promise<{ q?: string; paymentStatus?: string; period?: string; page?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await listAdminOrders({ page: params.page ? Number(params.page) : 1, search: params.q, paymentStatus: params.paymentStatus ?? "", period: params.period ?? "" });
  const paid = data.items.filter((order) => order.payment_status === "paid").length;
  const pending = data.items.filter((order) => order.payment_status === "pending").length;

  return <div className="space-y-5 pb-10">
    <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-white/65"><ArrowLeft className="h-4 w-4" />Vue d’ensemble</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Commerce</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Commandes</h1><p className="mt-2 text-sm text-white/65">Suivez les paiements et ouvrez le détail de chaque achat.</p></div><span className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold">{data.pagination.total} commande{data.pagination.total > 1 ? "s" : ""}</span></header>

    {data.notices.length ? <div className="grid gap-3 md:grid-cols-2">{data.notices.map((notice) => <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />)}</div> : null}

    <div className="grid grid-cols-2 gap-3"><article className="rounded-2xl border border-[#ded3c2] bg-white p-4"><p className="text-2xl font-bold text-[#246343]">{paid}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">Payées sur cette page</p></article><article className="rounded-2xl border border-[#ded3c2] bg-white p-4"><p className="text-2xl font-bold text-[#89611d]">{pending}</p><p className="mt-1 text-xs font-semibold text-[#766e64]">En attente sur cette page</p></article></div>

    <form action="/admin/orders" className="rounded-[24px] border border-[#ded3c2] bg-white p-4"><div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]"><label className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#887f74]" /><input name="q" defaultValue={params.q} placeholder="Client ou numéro de commande" className="h-11 w-full rounded-full border border-[#d9cebd] bg-[#fffaf2] pl-10 pr-4" /></label><select name="paymentStatus" defaultValue={params.paymentStatus ?? ""} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 text-sm"><option value="">Tous les paiements</option><option value="paid">Payé</option><option value="pending">En attente</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option></select><select name="period" defaultValue={params.period ?? ""} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 text-sm"><option value="">Toutes les dates</option><option value="7d">7 derniers jours</option><option value="30d">30 derniers jours</option><option value="90d">90 derniers jours</option><option value="365d">12 derniers mois</option></select><button className="h-11 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white">Filtrer</button></div></form>

    <section className="overflow-hidden rounded-[28px] border border-[#ded3c2] bg-white px-5 sm:px-6">{data.items.map((order) => <article key={order.id} className="border-b border-[#e8dfd2] py-5 last:border-0"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge kind="payment" value={order.payment_status} />{BOOK_FORMATS.map((format) => order.formatBreakdown[format] ? <span key={format} className="rounded-full bg-[#f1ece4] px-2.5 py-1 text-[.65rem] font-bold text-[#665f56]">{getBookFormatLabel(format)} × {order.formatBreakdown[format]}</span> : null)}</div><h2 className="mt-3 font-serif text-xl text-[#17231d]">Commande {order.id.slice(0, 8).toUpperCase()}</h2><p className="mt-1 truncate text-sm text-[#766e64]">{order.user_name}</p><p className="mt-2 text-xs text-[#92887c]">{formatAdminDateTime(order.created_at)} · {order.itemCount} article{order.itemCount > 1 ? "s" : ""}</p></div><div className="flex items-center justify-between gap-4 lg:justify-end"><strong className="text-lg text-[#17231d]">{formatMoney(order.total_price, order.currency_code)}</strong><Link href={`/admin/orders/${order.id}`} className="inline-flex h-10 items-center rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c]">Ouvrir</Link></div></div></article>)}{!data.items.length ? <div className="py-20 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-[#b7aa9a]" /><h2 className="mt-4 font-serif text-2xl">Aucune commande trouvée</h2><p className="mt-2 text-sm text-[#766e64]">Modifiez la recherche ou les filtres.</p></div> : null}</section>

    <AdminPagination basePath="/admin/orders" pagination={data.pagination} params={{ q: params.q ?? "", paymentStatus: params.paymentStatus ?? "", period: params.period ?? "" }} />
  </div>;
}
