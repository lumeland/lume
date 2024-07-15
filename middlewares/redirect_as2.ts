import type { Middleware } from "../core/server.ts";

export type Options = (url: URL) => Promise<URL> | URL | undefined | void;

export interface CommonOptions {
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

export interface HatsuOptions extends CommonOptions {
  /**
   * Hatsu instance.
   * @default `hatsu.local`
   */
  instance: URL["host"];
}

export interface BridgyFedOptions extends CommonOptions {
  /**
   * BridgyFed instance.
   * @default `fed.brid.gy`
   */
  instance?: URL["host"];
}

export const hatsu = (options: HatsuOptions): Options => (url: URL) => {
  const { host, origin, pathname } = new URL(url);
  if (pathname === "/") {
    return new URL(`https://${options.instance}/users/${options.host ?? host}`);
  } else {return new URL(
      `${origin}${pathname}`,
      `https://${options.instance}/posts/`,
    );}
};

export const bridgyFed =
  (options?: BridgyFedOptions): Options => (url: URL) => {
    const { host, origin, pathname } = new URL(url);
    const instance = options?.instance ?? "fed.brid.gy";
    if (pathname === "/") return new URL(`https://${instance}/${host}`);
    else return new URL(`${origin}${pathname}`, `https://${instance}/r/`);
  };

export default (rewriteUrl: Options): Middleware => async (req, next) => {
  const accept = req.headers.get("accept");
  if (
    accept && [
      "application/activity+json",
      'application/ld+json;profile="http://www.w3.org/ns/activitystreams"',
      'application/ld+json; profile="http://www.w3.org/ns/activitystreams"',
    ].some((type) => (accept.includes(type)))
  ) {
    const dest = await rewriteUrl(new URL(req.url));
    if (dest) return Response.redirect(dest);
  }

  return await next(req);
};
