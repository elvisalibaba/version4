import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api/client";

/** Administration lives in Laravel Filament. */
export default function LegacyAdminLayout({ children: _children }: { children: React.ReactNode }) {
  redirect(new URL("/admin", getApiBaseUrl()).toString());
}
