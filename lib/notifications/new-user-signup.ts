import "server-only";

import { sendServerEmail, getDefaultMailRecipients } from "@/lib/email/server";

type NewUserProfileRecord = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  preferred_language?: string | null;
  favorite_categories?: string[] | null;
  marketing_opt_in?: boolean | null;
  created_at?: string | null;
};

export type SupabaseInsertWebhookPayload<TRecord> = {
  type: "INSERT";
  table: string;
  schema: string;
  record: TRecord;
  old_record: null;
};

function formatUserName(record: NewUserProfileRecord) {
  const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ").trim();
  return fullName || record.name || "Non renseigne";
}

function formatCategories(record: NewUserProfileRecord) {
  const categories = Array.isArray(record.favorite_categories) ? record.favorite_categories.filter(Boolean) : [];
  return categories.length > 0 ? categories.join(", ") : "Aucune";
}

export async function sendAdminNewUserSignupNotification(record: NewUserProfileRecord) {
  const recipients = getDefaultMailRecipients();

  const lines = [
    "Nouvelle inscription HolistiqueBooks",
    "",
    `Nom: ${formatUserName(record)}`,
    `Email: ${record.email}`,
    `Role: ${record.role ?? "reader"}`,
    `User ID: ${record.id}`,
    `Telephone: ${record.phone ?? "-"}`,
    `Ville: ${record.city ?? "-"}`,
    `Pays: ${record.country ?? "-"}`,
    `Langue preferee: ${record.preferred_language ?? "fr"}`,
    `Categories favorites: ${formatCategories(record)}`,
    `Marketing opt-in: ${record.marketing_opt_in ? "Oui" : "Non"}`,
    `Cree le: ${record.created_at ?? new Date().toISOString()}`,
  ].join("\n");

  await sendServerEmail({
    to: recipients.to,
    subject: `Nouvelle inscription HolistiqueBooks - ${record.role ?? "reader"}`,
    text: lines,
  });
}
