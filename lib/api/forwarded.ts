import "server-only";

/**
 * Le front appelle l'API Laravel depuis le serveur Next : sans ces en-têtes,
 * Laravel voit l'IP du serveur Next pour TOUS les visiteurs, et les limites
 * (mot de passe oublié, renvoi de code, aperçu PDF…) sont partagées entre eux.
 *
 * L'IP réelle n'est acceptée par Laravel que si la clé partagée
 * FRONTEND_PROXY_SECRET correspond (même valeur des deux côtés, jamais NEXT_PUBLIC_).
 */
export function clientIpFromRequest(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();

  return first || request.headers.get("x-real-ip")?.trim() || null;
}

export function proxyForwardHeaders(request: Request): Record<string, string> {
  const secret = process.env.FRONTEND_PROXY_SECRET;
  const clientIp = clientIpFromRequest(request);

  if (!secret || !clientIp) {
    return {};
  }

  return {
    "X-Holistique-Proxy-Key": secret,
    "X-Holistique-Client-Ip": clientIp,
  };
}
