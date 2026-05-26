import type { Middleware } from "../core/server.ts";
import { merge } from "../core/utils/object.ts";

export interface Options {
  /** The regex to match the cache busting pattern */
  regex?: RegExp;
  /** The replacement string */
  replacement?: string;
}

export const defaults = {
  regex: /^\/v[\d]+\//,
  replacement: "/",
} satisfies Options;

/** Implements cache busting */
export function cacheBusting(options?: Options): Middleware {
  const { regex, replacement } = merge(defaults, options);

  return async (request, next) => {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.match(regex)) {
      url.pathname = pathname.replace(regex, replacement);
      request = new Request(url.href, {
        ...request,
      });
    }

    return await next(request);
  };
}

export default cacheBusting;
