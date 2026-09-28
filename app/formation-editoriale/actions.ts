"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import {
  isEditorialTrainingExperienceLevel,
  isEditorialTrainingPreferredFormat,
  isEditorialTrainingProfileType,
  isEditorialTrainingProjectStage,
  type EditorialTrainingRequestRow,
} from "@/lib/editorial-training";
import { sendAdminEditorialTrainingNotification } from "@/lib/notifications/editorial-training";

export type EditorialTrainingFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialEditorialTrainingFormState: EditorialTrainingFormState = {
  status: "idle",
  message: null,
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitEditorialTrainingRequestAction(
  _previousState: EditorialTrainingFormState,
  formData: FormData,
): Promise<EditorialTrainingFormState> {
  if (getString(formData, "website")) {
    return {
      status: "success",
      message: "Votre demande a bien été transmise. Notre équipe vous recontacte très vite.",
    };
  }

  const firstName = getString(formData, "first_name");
  const lastName = getString(formData, "last_name");
  const email = getString(formData, "email");
  const profileType = getString(formData, "profile_type");
  const experienceLevel = getString(formData, "experience_level");
  const projectStage = getString(formData, "project_stage");
  const preferredFormat = getString(formData, "preferred_format");
  const objectives = getString(formData, "objectives");
  const consentToContact = formData.get("consent_to_contact") === "on";

  if (!firstName || !lastName || !email || !objectives) {
    return {
      status: "error",
      message: "Merci de renseigner le prénom, le nom, l’email et vos objectifs de formation.",
    };
  }

  if (!isValidEmail(email)) {
    return { status: "error", message: "Merci de saisir une adresse email valide." };
  }

  if (!isEditorialTrainingProfileType(profileType)) {
    return { status: "error", message: "Le profil sélectionné est invalide." };
  }

  if (!isEditorialTrainingExperienceLevel(experienceLevel)) {
    return { status: "error", message: "Le niveau sélectionné est invalide." };
  }

  if (!isEditorialTrainingProjectStage(projectStage)) {
    return { status: "error", message: "Le stade du projet sélectionné est invalide." };
  }

  if (!isEditorialTrainingPreferredFormat(preferredFormat)) {
    return { status: "error", message: "Le format souhaité est invalide." };
  }

  if (!consentToContact) {
    return {
      status: "error",
      message: "Le consentement de contact est requis pour envoyer votre demande.",
    };
  }

  const payload = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: getNullableString(formData, "phone"),
    country: getNullableString(formData, "country"),
    city: getNullableString(formData, "city"),
    organization_name: getNullableString(formData, "organization_name"),
    profile_type: profileType,
    experience_level: experienceLevel,
    project_stage: projectStage,
    preferred_format: preferredFormat,
    objectives,
    message: getNullableString(formData, "message"),
    consent_to_contact: consentToContact,
    source: getNullableString(formData, "source") ?? "formation-editoriale",
  };

  try {
    const response = await apiServer<{ data: EditorialTrainingRequestRow }>("editorial-training", {
      method: "POST",
      body: payload,
      authenticated: false,
    });

    try {
      await sendAdminEditorialTrainingNotification(response.data);
    } catch (notificationError) {
      console.error("Editorial training notification failed:", notificationError);
    }

    revalidatePath("/formation-editoriale");

    return {
      status: "success",
      message: "Votre demande a bien été transmise. Notre équipe vous recontacte très vite.",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      const payload = error.payload as { message?: string; errors?: Record<string, string[]> } | null;
      const firstValidationError = payload?.errors
        ? Object.values(payload.errors).flat().find(Boolean)
        : null;

      return {
        status: "error",
        message: firstValidationError ?? payload?.message ?? "Impossible d’enregistrer votre demande pour le moment.",
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Une erreur est survenue pendant l’envoi du formulaire.",
    };
  }
}
