import type { Middleware } from "../core/server.ts";

export interface Options {
  /**
   * Rewrite URL function
   * `(url: URL, host: string) => URL | undefined | void`
   */
  rewriteUrl: RewriteUrl;

  /**
   * User domain.
   * @default `URL(req.url).host`
   */
  host?: string;
}

type RewriteUrl = (
  url: URL,
  host?: string,
) => Promise<URL> | URL | undefined | void;

export const hatsu = (instance: string): RewriteUrl => (url, host) => {
  const { pathname } = url;
  host ??= url.host;
  return url.pathname === "/"
    ? new URL(`https://${instance}/users/${host}`)
    : new URL(`https://${host}${pathname}`, `https://${instance}/posts/`);
};

export const bridgyFed =
  (instance = "fed.brid.gy"): RewriteUrl => (url, host) => {
    const { pathname } = url;
    host ??= url.host;
    return pathname === "/"
      ? new URL(`https://${instance}/${host}`)
      : new URL(`https://${host}${pathname}`, `https://${instance}/r/`);
  };

export function redirectAS2(options: Options): Middleware {
  return async (req, next) => {
    const accept = req.headers.get("accept");
    if (
      accept && [
        "application/activity+json",
        'application/ld+json;profile="http://www.w3.org/ns/activitystreams"',
        'application/ld+json; profile="http://www.w3.org/ns/activitystreams"',
      ].some((type) => (accept.includes(type)))
    ) {
      const dest = await options.rewriteUrl(new URL(req.url), options.host);
      if (dest) {
        return Response.redirect(dest);
      }
    }

    return await next(req);
  };
}

export default redirectAS2;
