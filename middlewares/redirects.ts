import type { Middleware } from "../core.ts";

export interface Options {
  redirects: Record<string, string | Redirect>;
}

export interface Redirect {
  to: string;
  code: 301 | 302 | 307 | 308 | 200;
}

/** Implements redirects */
export default function redirects(options: Options): Middleware {
  const redirects = new Map<string, Redirect>();

  for (const [from, to] of Object.entries(options.redirects)) {
    redirects.set(from, buildRedirects(to));
  }

  return async (request, next) => {
    const url = new URL(request.url);
    const redirect = redirects.get(url.pathname) || redirects.get(url.href);

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
