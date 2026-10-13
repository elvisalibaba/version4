import { redirect } from "next/navigation";
import { isSupabaseMode } from "@/lib/data-source";
export const dynamic="force-dynamic";
export default async function AdminPage(){redirect(isSupabaseMode()?"/dashboard/admin":"/dashboard");}
