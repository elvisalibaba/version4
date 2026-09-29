import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const apiUrl = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.aba.cd"
  ).replace(/\/$/, "");

  redirect(`${apiUrl}/admin`);
}
