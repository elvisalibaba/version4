import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBooksPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select("id, title, status, price, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">All books</h1>
      <div className="space-y-2">
        {data?.map((book) => (
          <article key={book.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium">{book.title}</p>
            <p className="text-sm text-slate-600">Status: {book.status}</p>
            <p className="text-sm text-slate-600">Price: ${book.price.toFixed(2)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
