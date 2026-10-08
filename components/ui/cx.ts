/** Concatène des classes en ignorant les valeurs vides. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
