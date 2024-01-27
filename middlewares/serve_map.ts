import binaryLoader from "../core/loaders/binary.ts";
import { getExtension } from "../core/utils/path.ts";
import { typeByExtension } from "../deps/media_types.ts";

import type { Middleware, RequestHandler } from "../core/server.ts";
import type { Entry } from "../core/fs.ts";

/** The options to configure the middleware server */
export interface Options {
  /** The map with the files to serve */
  map: Map<string, string | Uint8Array | Entry>;

  /** Serve the file as a fallback of the main middleware */
  after?: boolean;
}

export default function serveMap(options: Options): Middleware {
  return async function (
    request: Request,
    next: RequestHandler,
  ): Promise<Response> {
    let mainResponse: Response | undefined;

    if (options.after) {
      mainResponse = await next(request);

      if (mainResponse.status < 400) {
        return mainResponse;
      }
    }

    let path = new URL(request.url).pathname;

    if (path.endsWith("/")) {
      path += "index.html";
    }

    const entry = options.map.get(path);

    if (!entry) {
      return mainResponse || next(request);
    }

    if (typeof entry === "string" || entry instanceof Uint8Array) {
      return createResponse(path, entry);
    }

    const content = (await entry.getContent(binaryLoader))
      .content as Uint8Array;
    options.map.set(path, content);
    return createResponse(path, content);
  };
}

function createResponse(
  path: string,
  content: Uint8Array | string,
): Response {
  const type = typeByExtension(getExtension(path));
  const headers = new Headers();

  if (type) {
    headers.set("content-type", type);
  }

  return new Response(content, {
    status: 200,
    headers,
  });
}
