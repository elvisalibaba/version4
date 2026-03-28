import type { Database } from "@/types/database";

export const EDITORIAL_TRAINING_PROFILE_TYPES = [
  "author",
  "aspiring_editor",
  "publisher",
  "entrepreneur",
  "student",
  "other",
] as const;

export const EDITORIAL_TRAINING_EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const EDITORIAL_TRAINING_PROJECT_STAGES = [
  "idea",
  "drafting",
  "manuscript_ready",
  "existing_catalog",
] as const;

export const EDITORIAL_TRAINING_PREFERRED_FORMATS = [
  "online",
  "onsite",
  "hybrid",
] as const;

export type EditorialTrainingRequestRow =
  Database["public"]["Tables"]["editorial_training_requests"]["Row"];

export type EditorialTrainingProfileType =
  (typeof EDITORIAL_TRAINING_PROFILE_TYPES)[number];

export type EditorialTrainingExperienceLevel =
  (typeof EDITORIAL_TRAINING_EXPERIENCE_LEVELS)[number];

export type EditorialTrainingProjectStage =
  (typeof EDITORIAL_TRAINING_PROJECT_STAGES)[number];

export type EditorialTrainingPreferredFormat =
  (typeof EDITORIAL_TRAINING_PREFERRED_FORMATS)[number];

export const editorialTrainingProfileTypeLabels: Record<
  EditorialTrainingProfileType,
  string
> = {
  author: "Auteur",
  aspiring_editor: "Aspirant editeur",
  publisher: "Maison d edition",
  entrepreneur: "Entrepreneur",
  student: "Etudiant",
  other: "Autre profil",
};

export const editorialTrainingExperienceLevelLabels: Record<
  EditorialTrainingExperienceLevel,
  string
> = {
  beginner: "Debutant",
  intermediate: "Intermediaire",
  advanced: "Avance",
};

export const editorialTrainingProjectStageLabels: Record<
  EditorialTrainingProjectStage,
  string
> = {
  idea: "Idee en cours",
  drafting: "Manuscrit en cours",
  manuscript_ready: "Manuscrit termine",
  existing_catalog: "Catalogue existant",
};

export const editorialTrainingPreferredFormatLabels: Record<
  EditorialTrainingPreferredFormat,
  string
> = {
  online: "En ligne",
  onsite: "Presentiel",
  hybrid: "Hybride",
};

export const editorialTrainingProfileTypeOptions =
  EDITORIAL_TRAINING_PROFILE_TYPES.map((value) => ({
    value,
    label: editorialTrainingProfileTypeLabels[value],
  }));

export const editorialTrainingExperienceLevelOptions =
  EDITORIAL_TRAINING_EXPERIENCE_LEVELS.map((value) => ({
    value,
    label: editorialTrainingExperienceLevelLabels[value],
  }));

export const editorialTrainingProjectStageOptions =
  EDITORIAL_TRAINING_PROJECT_STAGES.map((value) => ({
    value,
    label: editorialTrainingProjectStageLabels[value],
  }));

export const editorialTrainingPreferredFormatOptions =
  EDITORIAL_TRAINING_PREFERRED_FORMATS.map((value) => ({
    value,
    label: editorialTrainingPreferredFormatLabels[value],
  }));

export function isEditorialTrainingProfileType(
  value: string,
): value is EditorialTrainingProfileType {
  return EDITORIAL_TRAINING_PROFILE_TYPES.includes(
    value as EditorialTrainingProfileType,
  );
}

export function isEditorialTrainingExperienceLevel(
  value: string,
): value is EditorialTrainingExperienceLevel {
  return EDITORIAL_TRAINING_EXPERIENCE_LEVELS.includes(
    value as EditorialTrainingExperienceLevel,
  );
}

export function isEditorialTrainingProjectStage(
  value: string,
): value is EditorialTrainingProjectStage {
  return EDITORIAL_TRAINING_PROJECT_STAGES.includes(
    value as EditorialTrainingProjectStage,
  );
}

export function isEditorialTrainingPreferredFormat(
  value: string,
): value is EditorialTrainingPreferredFormat {
  return EDITORIAL_TRAINING_PREFERRED_FORMATS.includes(
    value as EditorialTrainingPreferredFormat,
  );
}

export function getEditorialTrainingProfileTypeLabel(
  value: EditorialTrainingProfileType,
) {
  return editorialTrainingProfileTypeLabels[value];
}

export function getEditorialTrainingExperienceLevelLabel(
  value: EditorialTrainingExperienceLevel,
) {
  return editorialTrainingExperienceLevelLabels[value];
}

export function getEditorialTrainingProjectStageLabel(
  value: EditorialTrainingProjectStage,
) {
  return editorialTrainingProjectStageLabels[value];
}

export function getEditorialTrainingPreferredFormatLabel(
  value: EditorialTrainingPreferredFormat,
) {
  return editorialTrainingPreferredFormatLabels[value];
}

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildEditorialTrainingCsv(rows: EditorialTrainingRequestRow[]) {
  const headers = [
    "ID",
    "Date de reception",
    "Nom complet",
    "Prenom",
    "Nom",
    "Email",
    "Telephone",
    "Pays",
    "Ville",
    "Organisation",
    "Profil",
    "Niveau",
    "Stade du projet",
    "Format souhaite",
    "Objectifs",
    "Message",
    "Consentement contact",
    "Source",
    "Utilisateur connecte",
  ];

  const lines = rows.map((row) =>
    [
      row.id,
      row.created_at,
      `${row.first_name} ${row.last_name}`.trim(),
      row.first_name,
      row.last_name,
      row.email,
      row.phone,
      row.country,
      row.city,
      row.organization_name,
      getEditorialTrainingProfileTypeLabel(row.profile_type),
      getEditorialTrainingExperienceLevelLabel(row.experience_level),
      getEditorialTrainingProjectStageLabel(row.project_stage),
      getEditorialTrainingPreferredFormatLabel(row.preferred_format),
      row.objectives,
      row.message,
      row.consent_to_contact ? "Oui" : "Non",
      row.source,
      row.user_id,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [headers.map(escapeCsvCell).join(","), ...lines].join("\r\n");
}
