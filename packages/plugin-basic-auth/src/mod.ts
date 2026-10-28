import { merge } from "@lumeland/core/utils/object.ts";

import type { Middleware, RequestHandler } from "@lumeland/core/server.ts";

export interface Options {
  /** The realm to show in the authentication dialog */
  realm?: string;

  /** The users and passwords to use for authentication */
  users?: Record<string, string>;

  /** The error message to show when authentication fails */
  errorMessage?: string;
}

export const defaults = {
  realm: "Basic Authentication",
  users: {},
  errorMessage: "401 Unauthorized",
} satisfies Options;

export function basicAuth(userOptions?: Options): Middleware {
  const options = merge(defaults, userOptions);

  return async (request: Request, next: RequestHandler) => {
    const authorization = request.headers.get("authorization");
    if (authorization && checkAuthorization(authorization, options.users)) {
      return await next(request);
    }

    return new Response(options.errorMessage, {
      status: 401,
      statusText: "Unauthorized",
      headers: {
        "www-authenticate": `Basic realm="${options.realm}"`,
      },
    });
  };
}

function checkAuthorization(authorization: string, users: Record<string, string>): boolean {
  const match = authorization.match(/^Basic\s+(.*)$/);
  if (match) {
    const [user, pw] = atob(match[1]).split(":");
    for (const [u, p] of Object.entries(users)) {
      if (user === u && pw == p) {
        return true;
      }
    }
  }

  return false;
}

export default basicAuth;
