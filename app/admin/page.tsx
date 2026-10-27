import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/client";

/** Do not expose a second administration connected to another database. */
export default function LegacyAdminPage() {
  redirect(new URL("/admin", getApiBaseUrl()).toString());
}
