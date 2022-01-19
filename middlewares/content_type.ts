import { mimes } from "../core/utils.ts";
import { extname } from "../deps/path.ts";

import type { Middleware } from "../core.ts";

/** Add the Content-Type header */
export default function contentType(): Middleware {
  return async (req, next) => {
    const response = await next(req);
    const { pathname } = new URL(req.url);
    const ext = extname(pathname).toLowerCase();
    const contentType = ext
      ? mimes.get(ext) || "application/octet-stream"
      : mimes.get(".html")!;
    response.headers.set("content-type", contentType);
    return response;
  };
}
