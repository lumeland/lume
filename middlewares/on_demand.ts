import { posix } from "../deps/path.ts";
import { contentType } from "../deps/media_types.ts";

import type { Middleware, Site } from "../core.ts";

export type Router = (url: URL) => Promise<string | undefined>;

export interface Options {
  router: Router;
  site: Site;
}

/** Render pages on demand */
export default function onDemand(options: Options): Middleware {
  const { router, site } = options;

  return async (request, next) => {
    const response = await next(request);

    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    const file = await router(url);

    if (!file) {
      return response;
    }

    const page = await site.renderPage(file);

    if (!page) {
      return response;
    }

    // Redirect /example to /example/
    const pageUrl = page.data.url as string;
    if (!url.pathname.endsWith("/") && pageUrl.endsWith("/")) {
      return new Response(null, {
        status: 301,
        headers: {
          "location": posix.join(url.pathname, "/"),
        },
      });
    }

    const pageResponse = new Response(
      page.content,
      { status: 200 },
    );

    const type = contentType(page.dest.ext);

    if (type) {
      pageResponse.headers.set("content-type", type);
    }

    return pageResponse;
  };
}
