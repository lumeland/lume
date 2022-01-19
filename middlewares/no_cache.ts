import type { Middleware } from "../core.ts";

/** Add a header to prevent the browser cache */
export default function noCache(): Middleware {
  return async (request, next) => {
    const response = await next(request);
    response.headers.set("cache-control", "no-cache no-store must-revalidate");
    return response;
  };
}
