import type { createClient } from "@/lib/supabase/client";

/** Upload directly to Storage while reporting actual transfer progress. */
export async function uploadBookFile(
  supabase: ReturnType<typeof createClient>,
  path: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  const { data, error } = await supabase.storage.from("books").createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "Impossible de préparer l’envoi du fichier.");

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", data.signedUrl);
    request.timeout = 10 * 60 * 1000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round(event.loaded / event.total * 100)));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("L’envoi du fichier a échoué. Réessayez."));
      }
    };
    request.onerror = () => reject(new Error("Connexion interrompue pendant l’envoi. Réessayez."));
    request.ontimeout = () => reject(new Error("L’envoi a pris trop de temps. Réessayez."));
    request.onabort = () => reject(new Error("L’envoi du fichier a été interrompu."));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    request.send(body);
  });
  return path;
}
