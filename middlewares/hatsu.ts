import { merge } from "../core/utils/object.ts";

import type { Middleware } from "../core/server.ts";

export interface Options {
  /**
   * Hatsu instance URL.
   *
   * @default
   * ```ts
   * new URL('https://hatsu.local')
   * ```
   */
  instance: URL;
  /**
   * Match routes.
   *
   * @default
   * ```ts
   * [/^\/posts\/(.+)$/]
   * ```
   */
  matches?: (RegExp | string)[];
  /**
   * Whether to copy `/.well-known/` files.
   * @default `undefined`
   */
  wellKnown?: false;
  /**
   * Lume Site Location.
   * @defaultValue
   * ```ts
   * new URL(req.url).host
   * ```
   * @example
   * ```ts
   * const site = lume({ location: new URL('https://example.com') })
   * const server = new Server()
   * server.use(hatsuMiddleware({
   *   instance: new URL('https://hatsu.local'),
   *   location: site.options.location,
   * }))
   * ```
   */
  location?: URL;
}

export const defaults: Options = {
  instance: new URL('https://hatsu.local'),
  matches: [/^\/posts\/(.+)$/],
};

export default (userOptions: Options): Middleware => {
  const options = merge(defaults, userOptions);

  return async (req, next) => {
    const accept = req.headers.get("accept");
    const { origin, pathname, search } = new URL(req.url);

    // redirect .well-known
    if (pathname.startsWith("/.well-known/")) {
      return Response.redirect(
        new URL(pathname + search, options.instance),
      );
    } else if (
      // redirect application/activity+json request
      accept?.includes("application/activity+json") &&
      (!options.matches ||
        (options.matches.some((match) =>
          match instanceof RegExp
            ? pathname.match(match)
            : pathname.includes(match)
        )))
    ) {
      return Response.redirect(
        new URL(
          `/posts/${origin + pathname}`,
          options.instance,
        ),
      );
    } else {
      return await next(req);
    }
  };
}
