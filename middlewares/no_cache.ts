import type { Middleware } from "../core/server.ts";

/** Add a header to prevent the browser cache */
export function noCache(): Middleware {
  return async (request, next) => {
    const response = await next(request);
    const { headers } = response;
    headers.set("cache-control", "no-cache no-store must-revalidate");
    headers.delete("last-modified");
    headers.delete("etag");

    return response;
  };
}

export default noCache;
