import { merge } from "../core/utils/object.ts";
import { contentType } from "../deps/media_types.ts";
import { extname } from "../deps/path.ts";

import type { Middleware, RequestHandler } from "../core/server.ts";

/** The options to configure the middleware server */
export interface Options {
  encodings: Record<string, string>;
}

export const defaults: Options = {
  encodings: {
    br: ".br",
    gzip: ".gz",
  },
};

export function preCompress(userOptions?: Options): Middleware {
  const options = merge(defaults, userOptions);

  return async function (
    request: Request,
    next: RequestHandler,
  ): Promise<Response> {
    const accepted = new Set(
      request.headers.get("Accept-Encoding")
        ?.split(",")
        .map((encoding) => encoding.split(";").shift()?.trim())
        .filter((encoding) => encoding),
    );

    if (!accepted.size) {
      return next(request);
    }

    for (const [encoding, ext] of Object.entries(options.encodings)) {
      if (!accepted.has(encoding)) {
        continue;
      }

      const newUrl = new URL(request.url);
      const initialExtension = newUrl.pathname.endsWith("/")
        ? ".html"
        : extname(newUrl.pathname);
      newUrl.pathname += newUrl.pathname.endsWith("/")
        ? `index.html${ext}`
        : ext;
      const compressedRequest = new Request(newUrl, request);
      const response = await next(compressedRequest);

      if (response.status >= 400) {
        continue;
      }

      response.headers.set(
        "Content-Type",
        contentType(initialExtension) || "application/octet-stream",
      );
      response.headers.set("Content-Encoding", encoding);
      response.headers.append("Vary", "Accept-Encoding");
      return response;
    }

    return next(request);
  };
}

export default preCompress;
