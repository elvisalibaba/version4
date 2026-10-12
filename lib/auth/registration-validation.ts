/**
 * Règles d'inscription alignées sur RegisterRequest.php :
 * Password::min(8)->letters()->numbers().
 * Les textes affichés ne doivent jamais révéler les clés de traduction Laravel.
 */
export function getRegistrationPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasLetter: /\p{L}/u.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

export function getRegistrationPasswordError(password: string): string | null {
  const checks = getRegistrationPasswordChecks(password);
  if (!checks.minLength) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!checks.hasLetter) return "Le mot de passe doit contenir au moins une lettre.";
  if (!checks.hasNumber) return "Le mot de passe doit contenir au moins un chiffre (0 à 9).";
  return null;
}

const validationMessages: Record<string, string> = {
  "validation.password.numbers": "Le mot de passe doit contenir au moins un chiffre (0 à 9).",
  "validation.password.letters": "Le mot de passe doit contenir au moins une lettre.",
  "validation.password.mixed": "Le mot de passe doit contenir une majuscule et une minuscule.",
  "validation.password.symbols": "Le mot de passe doit contenir au moins un symbole.",
  "validation.password.uncompromised": "Ce mot de passe figure dans une fuite connue. Choisissez-en un autre.",
  "validation.confirmed": "Les deux mots de passe ne correspondent pas.",
  "validation.email": "Indiquez une adresse email valide.",
  "validation.unique": "Cette adresse email est déjà utilisée. Connectez-vous ou réinitialisez votre mot de passe.",
  "validation.required": "Complétez tous les champs obligatoires.",
  "validation.password.min": "Le mot de passe doit contenir au moins 8 caractères.",
  "validation.min.string": "Le mot de passe doit contenir au moins 8 caractères.",
};

/** Affiche les messages de validation lisibles même si l'API n'a pas ses fichiers de traduction déployés. */
export function toReadableRegistrationError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const message = value.trim();
  if (validationMessages[message]) return validationMessages[message];
  // Ne pas présenter les clés internes comme des phrases destinées au lecteur.
  if (/^(validation|passwords)\.[a-z0-9_.]+$/i.test(message)) {
    return "Certaines informations ne respectent pas les règles d’inscription. Vérifiez les champs et réessayez.";
  }
  return message;
}

export function getRegistrationErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Inscription impossible. Réessayez.";
  const data = payload as { errors?: Record<string, unknown>; message?: unknown };
  if (data.errors && typeof data.errors === "object") {
    // Privilégier les erreurs de mot de passe pour répondre au cas le plus fréquent.
    const keys = ["password", ...Object.keys(data.errors).filter((key) => key !== "password")];
    for (const key of keys) {
      const errors = data.errors[key];
      const values = Array.isArray(errors) ? errors : [errors];
      for (const entry of values) {
        const readable = toReadableRegistrationError(entry);
        if (readable) return readable;
      }
    }
  }
  return toReadableRegistrationError(data.message) ?? "Inscription impossible. Vérifiez les informations saisies.";
}
