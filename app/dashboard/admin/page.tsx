import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  redirect("https://api.aba.cd/admin");
}
