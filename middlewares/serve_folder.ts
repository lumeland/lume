import { serveFile } from "../core/server.ts";

import type { Middleware, RequestHandler } from "../core/server.ts";

/** The options to configure the middleware server */
export interface Options {
  /** The root path */
  root: string;

  /** Serve the file as a fallback of the main middleware */
  after?: boolean;
}

export function serveFolder(options: Options): Middleware {
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

    const altResponse = await serveFile(options.root, request);

    if (altResponse.status < 400) {
      return altResponse;
    }

    return mainResponse || next(request);
  };
}

export default serveFolder;
