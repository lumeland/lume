import { brightGreen, gray, red } from "../deps/colors.ts";

import type { Middleware } from "../core/server.ts";

/** Log the request/responses */
export default function log(): Middleware {
  return async (request, next) => {
    try {
      const response = await next(request);
      const url = new URL(request.url);
      const pathname = decodeURIComponent(url.pathname);
      const { status } = response;

      if (status === 404 || status === 500) {
        console.log(`${red(status.toString())} ${pathname}`);
      } else if (status === 200) {
        console.log(`${brightGreen(status.toString())} ${pathname}`);
      } else if (status === 301 || status === 302) {
        console.log(
          `${gray(status.toString())} ${pathname} => ${
            response.headers?.get(
              "location",
            )
          }`,
        );
      } else {
        console.log(`${gray(status.toString())} ${pathname}`);
      }

      return response;
    } catch (cause) {
      return new Response(
        `Error: ${cause.toString()}`,
        { status: 500 },
      );
    }
  };
}
