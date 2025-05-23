import type { Middleware } from "../core/server.ts";

export interface Options {
  /** The regex to match the cache busting pattern */
  regex: RegExp;
  /** The replacement string */
  replacement: string;
}

export const defaults: Options = {
  regex: /^\/v[\d]+\//,
  replacement: "/",
};

/** Implements cache busting */
export function cacheBusting(options?: Partial<Options>): Middleware {
  const { regex, replacement } = { ...defaults, ...options };

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
