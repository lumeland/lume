import { merge } from "../core/utils/object.ts";

import type { Middleware, RequestHandler } from "../core/server.ts";

export interface Options {
  realm: string;
  users: Record<string, string>;
}

export const defaults: Options = {
  realm: "Basic Authentication",
  users: {},
};

// Code from https://deno.land/x/basic_auth@v1.0.1/mod.ts
export function basicAuth(
  userOptions?: Partial<Options>,
): Middleware {
  const options = merge(defaults, userOptions);

  return async (request: Request, next: RequestHandler) => {
    const authorization = request.headers.get("authorization");
    if (authorization && checkAuthorization(authorization, options.users)) {
      return await next(request);
    }

    return new Response("401 Unauthorized", {
      status: 401,
      statusText: "Unauthorized",
      headers: {
        "www-authenticate": `Basic realm="${options.realm}"`,
      },
    });
  };
}

function checkAuthorization(
  authorization: string,
  users: Record<string, string>,
): boolean {
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
