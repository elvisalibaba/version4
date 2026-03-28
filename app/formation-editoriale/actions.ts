"use server";

import { revalidatePath } from "next/cache";
import {
  isEditorialTrainingExperienceLevel,
  isEditorialTrainingPreferredFormat,
  isEditorialTrainingProfileType,
  isEditorialTrainingProjectStage,
} from "@/lib/editorial-training";
import { sendAdminEditorialTrainingNotification } from "@/lib/notifications/editorial-training";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

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
      message:
        "Votre demande a bien ete transmise. Notre equipe vous recontacte tres vite.",
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
      message:
        "Merci de renseigner le prenom, le nom, l email et vos objectifs de formation.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Merci de saisir une adresse email valide.",
    };
  }

  if (!isEditorialTrainingProfileType(profileType)) {
    return {
      status: "error",
      message: "Le profil selectionne est invalide.",
    };
  }

  if (!isEditorialTrainingExperienceLevel(experienceLevel)) {
    return {
      status: "error",
      message: "Le niveau selectionne est invalide.",
    };
  }

  if (!isEditorialTrainingProjectStage(projectStage)) {
    return {
      status: "error",
      message: "Le stade du projet selectionne est invalide.",
    };
  }

  if (!isEditorialTrainingPreferredFormat(preferredFormat)) {
    return {
      status: "error",
      message: "Le format souhaite est invalide.",
    };
  }

  if (!consentToContact) {
    return {
      status: "error",
      message:
        "Le consentement de contact est requis pour envoyer votre demande.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const submittedAt = new Date().toISOString();
    const requestRecord: Database["public"]["Tables"]["editorial_training_requests"]["Row"] =
      {
        id: crypto.randomUUID(),
        user_id: user?.id ?? null,
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
        source:
          getNullableString(formData, "source") ?? "formation-editoriale",
        created_at: submittedAt,
        updated_at: submittedAt,
      };

    const { error } = await supabase
      .from("editorial_training_requests")
      .insert(requestRecord);

    if (error) {
      return {
        status: "error",
        message:
          error?.message ??
          "Impossible d enregistrer votre demande pour le moment.",
      };
    }

    try {
      await sendAdminEditorialTrainingNotification(requestRecord);
    } catch (notificationError) {
      console.error(
        "Editorial training notification failed:",
        notificationError,
      );
    }

    revalidatePath("/admin/editorial-training");

    return {
      status: "success",
      message:
        "Votre demande a bien ete transmise. Notre equipe vous recontacte tres vite.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l envoi du formulaire.",
    };
  }
}
