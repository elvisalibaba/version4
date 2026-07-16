import "server-only";

import {
  getEditorialTrainingExperienceLevelLabel,
  getEditorialTrainingPreferredFormatLabel,
  getEditorialTrainingProfileTypeLabel,
  getEditorialTrainingProjectStageLabel,
  type EditorialTrainingRequestRow,
} from "@/lib/editorial-training";
import { getDefaultMailRecipients, sendServerEmail } from "@/lib/email/server";

export async function sendAdminEditorialTrainingNotification(
  record: EditorialTrainingRequestRow,
) {
  const recipients = getDefaultMailRecipients();

  const lines = [
    "Nouvelle inscription - formation editoriale",
    "",
    `Nom: ${record.first_name} ${record.last_name}`.trim(),
    `Email: ${record.email}`,
    `Telephone: ${record.phone ?? "-"}`,
    `Pays: ${record.country ?? "-"}`,
    `Ville: ${record.city ?? "-"}`,
    `Organisation: ${record.organization_name ?? "-"}`,
    `Profil: ${getEditorialTrainingProfileTypeLabel(record.profile_type)}`,
    `Niveau: ${getEditorialTrainingExperienceLevelLabel(record.experience_level)}`,
    `Stade du projet: ${getEditorialTrainingProjectStageLabel(record.project_stage)}`,
    `Format souhaite: ${getEditorialTrainingPreferredFormatLabel(record.preferred_format)}`,
    `Consentement contact: ${record.consent_to_contact ? "Oui" : "Non"}`,
    `Source: ${record.source}`,
    `Date: ${record.created_at}`,
    `User ID: ${record.user_id ?? "-"}`,
    "",
    "Objectifs:",
    record.objectives,
    "",
    "Message complementaire:",
    record.message ?? "-",
  ].join("\n");

  await sendServerEmail({
    to: recipients.to,
    subject: "Nouvelle demande de formation editoriale",
    text: lines,
  });
}
