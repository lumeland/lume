import { posix } from "../deps/path.ts";
import { contentType } from "../deps/media_types.ts";

import type { Middleware, Site } from "../core.ts";

export type Router = (url: URL) => string | undefined;

export interface Options {
  site: Site;
  router?: Router;
}

/** Render pages on demand */
export default function onDemand(options: Options): Middleware {
  const site = options.site;
  let router = options.router;

  return async (request, next) => {
    const response = await next(request);

    if (response.status !== 404) {
      return response;
    }

    if (!router) {
      router = await createDefaultRouter(site.src("_routes.json"));
    }

    const url = new URL(request.url);
    const file = router(url);

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

async function createDefaultRouter(file: string): Promise<Router> {
  const routes: Record<string, string> = JSON.parse(
    await Deno.readTextFile(file),
  );
  return getRouter(new Map(Object.entries(routes)));
}

export function getRouter(routes: Map<string, string>): Router {
  return function match(url: URL): string | undefined {
    const { pathname } = url;
    const path = routes.get(pathname);

    // Handle urls like /example as /example/
    if (!path && !pathname.endsWith("/")) {
      return routes.get(pathname + "/");
    }

    return path;
  };
}
