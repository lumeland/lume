import type { Middleware } from "../core/server.ts";

export interface Options {
  /** A map of redirects */
  redirects: Record<string, string | Redirect>;
  /** Whether distinguish the trailing slash or not */
  strict?: boolean;
}

export interface Redirect {
  to: string;
  code: 301 | 302 | 303 | 307 | 308 | 200;
}

/** Implements redirects */
export function redirects(options: Options): Middleware {
  const redirects = new Map<string, Redirect>();

  for (const [from, to] of Object.entries(options.redirects)) {
    redirects.set(from, buildRedirects(to));
  }

  const strict = options.strict ?? true;

  function findRedirect(url: string): Redirect | undefined {
    if (strict) {
      return redirects.get(url);
    }

    // Remove the trailing slash
    const cleaned = url === "/" ? url : url.replace(/\/$/, "");
    return redirects.get(cleaned) || redirects.get(cleaned + "/");
  }

  return async (request, next) => {
    const url = new URL(request.url);
    const redirect = findRedirect(url.pathname) || findRedirect(url.href);

    if (!redirect) {
      return await next(request);
    }

    switch (redirect.code) {
      case 301:
      case 302:
      case 307:
      case 308:
        return new Response(null, {
          status: redirect.code,
          headers: {
            location: redirect.to,
          },
        });

      case 200:
        url.pathname = redirect.to;
        request = new Request(url.href, {
          ...request,
        });
    }

    return await next(request);
  };
}

function buildRedirects(redirect: string | Redirect): Redirect {
  if (typeof redirect === "string") {
    return {
      to: redirect,
      code: 301,
    };
  }

  return redirect;
}

export default redirects;
