import { merge } from "../core/utils/object.ts";
import { setEnv } from "../core/utils/env.ts";

import type { Middleware } from "../core/server.ts";
import type Site from "../core/site.ts";

// deno-lint-ignore no-explicit-any
type Cms = any; // Replace with actual CMS type

export interface Options {
  /** The CMS instance */
  cms: Cms;

  /** The path to the CMS */
  basePath?: string;
}

// Default options
export const defaults: Partial<Options> = {
  basePath: "/admin",
};

/**
 * A plugin to use LumeCMS
 */
export function lumeCMS(userOptions: Options) {
  const options = merge(defaults, userOptions);
  const { cms, basePath } = options;

  if (!cms) {
    throw new Error("LumeCMS requires a CMS instance");
  }

  return (site: Site) => {
    // Enable drafts previews in the CMS
    setEnv("LUME_DRAFTS", "true");
    setEnv("LUME_CMS", "true");

    // Set the site URL if it's not set
    if (!cms.options.site?.url) {
      cms.options.site!.url = site.url("/", true);
    }

    // Set the base path for the CMS
    cms.options.basePath = basePath;

    // Configure the src storage
    cms.storage("src");
    cms.options.root = site.src();

    // Store the Site instance in the CMS
    const data = cms.options.data ?? {};
    data.site = site;
    cms.options.data = data;

    // Set the preview URL function
    cms.options.previewURL ??= function previewURL(
      path: string,
      data: unknown,
      hasChanged?: boolean,
    ): undefined | string | Promise<string | undefined> {
      if (hasChanged) {
        return new Promise((resolve) => {
          site.addEventListener("idle", () => {
            resolve(previewURL(path, data));
          }, { once: true });
        });
      }

      for (const page of site.pages) {
        if (page.src.entry?.src === path) {
          return site.url(page.outputPath, true);
        }
      }
    };

    //Set the source path directory
    cms.options.sourcePath ??= (url: string): string | undefined => {
      const { pathname } = new URL(url);

      for (const page of site.pages) {
        if (page.data.url === pathname) {
          return page.src.entry?.path;
        }
      }
    };

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

    // Show the CMS in the debugbar
    function showCMS() {
      const item = site.debugBar?.buildItem(
        `[Lume CMS] CMS running at <a href="${baseUrl}" target="_blank">${baseUrl}</a>`,
      );
      if (item) {
        item.actions = [
          {
            text: "Edit content",
            icon: "pencil-simple",
            onclick:
              `window.open("${baseUrl}?edit=" + decodeURIComponent(document.location), "_top");`,
          },
        ];
      }
    }
    site.addEventListener("beforeBuild", showCMS);
    site.addEventListener("beforeUpdate", showCMS);
  };
}

export default lumeCMS;
