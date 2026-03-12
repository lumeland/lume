import type { Middleware } from "../core/server.ts";

export interface Options {
  /** A map of redirects */
  redirects: Record<string, string | Redirect>;

  /** Whether distinguish the trailing slash or not */
  strict?: boolean;

  /** List of search params to copy to the final URL */
  copySearchParams: (string | RegExp)[];
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

  function findRedirect(url: string): Redirect | undefined {
    if (options.strict) {
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

    const to = new URL(redirect.to, url);

    if (options.copySearchParams) {
      for (const [key, value] of url.searchParams) {
        const shouldCopy = options.copySearchParams.some(
          (name) => (name instanceof RegExp ? name.test(key) : key === name),
        );

        if (shouldCopy) {
          to.searchParams.append(key, value);
        }
      }
    }

    switch (redirect.code) {
      case 301:
      case 302:
      case 307:
      case 308:
        return new Response(null, {
          status: redirect.code,
          headers: {
            location: to.href,
          },
        });

      case 200:
        request = new Request(to.href, {
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
