import { describe, expect, it } from "vitest";
import {
  getRegistrationPasswordChecks,
  getRegistrationPasswordError,
  getRegistrationErrorMessage,
} from "./registration-validation";

describe("règles du mot de passe à l'inscription", () => {
  it("exige au moins huit caractères", () => {
    expect(getRegistrationPasswordError("Abc123")).toContain("8 caractères");
  });
  it("exige une lettre et un chiffre, comme Laravel", () => {
    expect(getRegistrationPasswordError("abcdefgh")).toContain("chiffre");
    expect(getRegistrationPasswordError("12345678")).toContain("lettre");
  });
  it("accepte les lettres accentuées et des chiffres décimaux", () => {
    expect(getRegistrationPasswordChecks("Édition2026").hasLetter).toBe(true);
    expect(getRegistrationPasswordError("Édition2026")).toBeNull();
  });
  it("évite les clés internes retournées par l'API", () => {
    expect(getRegistrationErrorMessage({ errors: { password: ["validation.password.numbers"] } }))
      .toBe("Le mot de passe doit contenir au moins un chiffre (0 à 9).");
    expect(getRegistrationErrorMessage({ message: "validation.password.letters" }))
      .toContain("au moins une lettre");
    expect(getRegistrationErrorMessage({ message: "validation.custom.future_rule" }))
      .not.toContain("validation.");
  });
  it("préserve les erreurs métier lisibles", () => {
    expect(getRegistrationErrorMessage({ errors: { email: ["Cette adresse est déjà utilisée."] } }))
      .toBe("Cette adresse est déjà utilisée.");
  });
});
