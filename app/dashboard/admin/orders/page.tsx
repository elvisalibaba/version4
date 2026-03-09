import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOrdersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, user_id, total_price, payment_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">All orders</h1>
      <div className="space-y-2">
        {data?.map((order) => (
          <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium">Order {order.id.slice(0, 8)}</p>
            <p className="text-sm text-slate-600">User: {order.user_id}</p>
            <p className="text-sm text-slate-600">Status: {order.payment_status}</p>
            <p className="text-sm text-slate-600">Total: ${order.total_price.toFixed(2)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
