import { redirect } from "next/navigation";
import { isSupabaseMode } from "@/lib/data-source";
export default async function AdminDashboardPage() {
  redirect(isSupabaseMode() ? "/admin" : "https://api.aba.cd/admin");
}
