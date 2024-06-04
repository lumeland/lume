import type { Middleware } from "../core/server.ts";

/** Add a header to prevent CORS errors (used in development) */
export default function noCors(): Middleware {
  return async (request, next) => {
    const response = await next(request);
    response.headers.set("access-control-allow-origin", "*");

    return response;
  };
}
