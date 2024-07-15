import type { Middleware } from "../core/server.ts";

export interface Data {
  /**
   * User domain.
   * @default
   * ```ts
   * new URL(req.url).host
   * ```
   * @example
   * ```ts
   * site.options.location.host
   * ```
   */
  host?: URL["host"];
}
export interface Options extends Data {
  /**
   * Rewrite URL function.
   * @param url req.url
   * @returns Rewritten URLs or empty
   */
  rewriteUrl: (url: URL, data: Data) => Promise<URL> | URL | undefined | void;
  /**
   * User domain.
   * @default
   * ```ts
   * new URL(req.url).host
   * ```
   * @example
   * ```ts
   * site.options.location.host
   * ```
   */
  host?: URL["host"];
}

export const hatsu =
  (instance: URL["host"]): Options["rewriteUrl"] => (url, data) => {
    const { pathname } = url;
    const host = data.host ?? url.host;
    if (url.pathname === "/") {
      return new URL(`https://${instance}/users/${host}`);
    } else {
      return new URL(
        `https://${host}${pathname}`,
        `https://${instance}/posts/`,
      );
    }
  };

export const bridgyFed =
  (instance: URL["host"] = "fed.brid.gy"): Options["rewriteUrl"] =>
  (url, data) => {
    const { pathname } = url;
    const host = data.host ?? url.host;
    if (pathname === "/") return new URL(`https://${instance}/${host}`);
    else return new URL(`https://${host}${pathname}`, `https://${instance}/r/`);
  };

export default (options: Options): Middleware => async (req, next) => {
  const accept = req.headers.get("accept");
  if (
    accept && [
      "application/activity+json",
      'application/ld+json;profile="http://www.w3.org/ns/activitystreams"',
      'application/ld+json; profile="http://www.w3.org/ns/activitystreams"',
    ].some((type) => (accept.includes(type)))
  ) {
    const dest = await options.rewriteUrl(new URL(req.url), {
      host: options.host,
    });
    if (dest) return Response.redirect(dest);
  }

  return await next(req);
};
