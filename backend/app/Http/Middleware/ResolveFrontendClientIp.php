<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Le front Next.js appelle l'API depuis son serveur : sans cela, Laravel voit
 * la même IP pour tous les visiteurs et les limites de débit (mot de passe
 * oublié, renvoi de code, aperçu PDF…) sont partagées par tout le monde.
 *
 * L'IP transmise n'est acceptée que si la clé partagée FRONTEND_PROXY_SECRET
 * correspond : un client ne peut donc pas usurper une IP pour contourner les limites.
 */
class ResolveFrontendClientIp
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('holistic.frontend_proxy_secret', '');
        $providedKey = (string) $request->headers->get('X-Holistique-Proxy-Key', '');
        $clientIp = trim((string) $request->headers->get('X-Holistique-Client-Ip', ''));

        if (
            $secret !== ''
            && $providedKey !== ''
            && hash_equals($secret, $providedKey)
            && filter_var($clientIp, FILTER_VALIDATE_IP) !== false
        ) {
            $request->server->set('REMOTE_ADDR', $clientIp);
        }

        // Le secret ne doit jamais atteindre les logs ni le code applicatif.
        $request->headers->remove('X-Holistique-Proxy-Key');

        return $next($request);
    }
}
