"use server";

import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import type { EditorialTrainingProfileType, EditorialTrainingRequestRow } from "@/lib/editorial-training";
import { sendAdminEditorialTrainingNotification } from "@/lib/notifications/editorial-training";

export type HomeContactState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

/** Profils proposés sur l'accueil, rapprochés des profils de demande éditoriale. */
const CONTACT_PROFILES: Record<string, { label: string; profileType: EditorialTrainingProfileType }> = {
  author: { label: "Auteur", profileType: "author" },
  church: { label: "Église ou ministère", profileType: "other" },
  institution: { label: "Institution ou ONG", profileType: "other" },
  company: { label: "Entreprise ou dirigeant", profileType: "entrepreneur" },
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Formulaire de contact de l'accueil : la demande rejoint les demandes
 * d'accompagnement éditorial (source « home_contact ») traitées par l'équipe.
 */
export async function submitHomeContactAction(_previous: HomeContactState, formData: FormData): Promise<HomeContactState> {
  const fullName = field(formData, "full_name");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const project = field(formData, "project");
  const profile = CONTACT_PROFILES[field(formData, "profile")];

  if (!fullName || !email || !project) {
    return { status: "error", message: "Merci d’indiquer votre nom, votre e-mail et quelques mots sur votre projet." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Merci de saisir une adresse e-mail valide." };
  }
  if (!profile) {
    return { status: "error", message: "Merci de préciser qui vous êtes." };
  }

  const [firstName, ...rest] = fullName.split(/\s+/);

  try {
    const response = await apiServer<{ data: EditorialTrainingRequestRow }>("editorial-training", {
      method: "POST",
      authenticated: false,
      body: {
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
        email,
        phone: phone || null,
        organization_name: profile.profileType === "author" ? null : profile.label,
        profile_type: profile.profileType,
        experience_level: "beginner",
        project_stage: "idea",
        preferred_format: "hybrid",
        objectives: project,
        message: `Profil : ${profile.label}`,
        consent_to_contact: true,
        source: "home_contact",
      },
    });

    try {
      await sendAdminEditorialTrainingNotification(response.data);
    } catch (notificationError) {
      console.error("Home contact notification failed:", notificationError);
    }

    return { status: "success", message: "Merci ! Votre demande est bien arrivée : notre équipe vous recontacte très vite." };
  } catch (error) {
    if (error instanceof ApiError) {
      const payload = error.payload as { message?: string; errors?: Record<string, string[]> } | null;
      const firstError = payload?.errors ? Object.values(payload.errors).flat().find(Boolean) : null;
      return { status: "error", message: firstError ?? payload?.message ?? "Impossible d’envoyer votre demande pour le moment." };
    }
    return { status: "error", message: "Impossible d’envoyer votre demande pour le moment. Réessayez ou appelez-nous." };
  }
}
