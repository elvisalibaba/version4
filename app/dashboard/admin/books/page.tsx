import { redirect } from "next/navigation";

export default async function AdminBooksPage() {
  redirect("/admin/books");
}
