import { merge } from "../core/utils/object.ts";
import { setEnv } from "../core/utils/env.ts";

import type { Middleware } from "../core/server.ts";
import type Site from "../core/site.ts";

// deno-lint-ignore no-explicit-any
type Cms = any; // Replace with actual CMS type

export interface Options {
  /** The CMS instance */
  cms?: Cms;

  /** The path to the CMS */
  basePath?: string;
}

// Default options
export const defaults: Options = {
  basePath: "/admin",
};

/**
 * A plugin to use LumeCMS
 */
export function lumeCMS(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const { cms, basePath } = options;

  return (site: Site) => {
    // Enable drafts previews in the CMS
    setEnv("LUME_DRAFTS", "true");
    setEnv("LUME_CMS", "true");

    // Set the site URL if it's not set
    if (!cms.options.site?.url) {
      cms.options.site!.url = site.url("/", true);
    }

    // Configure the src storage
    cms.storage("src");
    cms.options.root = site.src();

    // Store the Site instance in the CMS
    const data = cms.options.data ?? {};
    data.site = site;
    cms.options.data = data;

    // Set the preview URL function
    const previewURL = (
      path: string,
      hasChanged?: boolean,
    ): undefined | string | Promise<string | undefined> => {
      if (hasChanged) {
        return new Promise((resolve) => {
          site.addEventListener("idle", () => {
            resolve(previewURL(path));
          }, { once: true });
        });
      }

      for (const page of site.pages) {
        if (page.src.entry?.src === path) {
          return site.url(page.outputPath, true);
        }
      }
    };
    cms.options.previewURL = previewURL;

    //Set the source path directory
    const sourcePath = (url: string): string | undefined => {
      const { pathname } = new URL(url);

      for (const page of site.pages) {
        if (page.data.url === pathname) {
          return page.src.entry?.src;
        }
      }
    };
    cms.options.sourcePath = sourcePath;

    // Middleware to handle CMS requests
    const router = cms.init();
    const baseUrl = site.url(basePath);
    const middleware: Middleware = (request, next) => {
      const { pathname } = new URL(request.url);
      if (pathname === baseUrl || pathname.startsWith(baseUrl + "/")) {
        return router.fetch(request);
      }
      return next(request);
    };
    site.options.server.middlewares.push(middleware);

    // Set the CMS tab in the debugbar
    const panel = site.debugBar?.collection("Lume CMS");
    if (panel) {
      panel.icon = "pencil-simple";
      panel.items.push({
        title:
          `CMS running at <a href="${baseUrl}" target="_blank">${basePath}</a>`,
        actions: [
          {
            text: "Edit content",
            onclick:
              `document.location.href = "${baseUrl}?edit=" + decodeURIComponent(document.location)`,
          },
        ],
      });
    }
  };
}

export default lumeCMS;
