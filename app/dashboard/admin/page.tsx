import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="flex gap-3">
        <Link href="/dashboard/admin/users" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">
          Users
        </Link>
        <Link href="/dashboard/admin/books" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">
          Books
        </Link>
        <Link href="/dashboard/admin/orders" className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">
          Orders
        </Link>
      </div>
    </section>
  );
}
