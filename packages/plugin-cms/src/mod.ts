import { merge } from "@lumeland/core/utils/object.ts";
import { Fs } from "@lumeland/cms/storage/fs.ts";
import { posix } from "../deps/path.ts";

import type { Middleware } from "@lumeland/core/server.ts";
import type Site from "@lumeland/core/site.ts";
import type CMS from "@lumeland/cms/core/cms.ts";
import type { Storage } from "@lumeland/cms/types.ts";
import { log } from "@lumeland/core/utils/log.ts";

export interface Options {
  /** The CMS instance */
  cms: CMS;

  /** The path to the CMS */
  basePath?: string;
}

// Default options
export const defaults = {
  basePath: "/admin",
} satisfies Partial<Options>;

/**
 * A plugin to use LumeCMS
 */
export function lumeCms(userOptions: Options) {
  const options = merge(defaults, userOptions);
  const { cms, basePath } = options;

  return (site: Site) => {
    // Set the site URL if it's not set
    if (!cms.options.site.url) {
      cms.options.site.url = site.url("/", true);
    }

    // Set the base path for the CMS
    cms.options.basePath = basePath;

    // Configure the src storage (if not defined)
    const root = site.src();
    const src = new Fs({ root });
    if (cms.storages.get("src") === undefined) {
      cms.storage("src", src);
    }
    cms.options.root = root;

    // Store the Site instance in the CMS
    const data = cms.options.data ?? {};
    data.site = site;
    cms.options.data = data;

    // Set the function to return the preview URL
    cms.options.previewUrl ??= function previewUrl(
      path: string,
      _: unknown,
      hasChanged: boolean,
      storage: Storage,
    ): undefined | string | Promise<string | undefined> {
      if (!(storage instanceof Fs) || !posix.join(storage.root, storage.path).startsWith(root)) {
        return;
      }

      if (hasChanged) {
        return new Promise((resolve) => {
          site.addEventListener(
            "idle",
            () => {
              resolve(previewUrl(path, data, false, storage));
            },
            { once: true },
          );
        });
      }

      for (const page of site.pages) {
        if (page.src.entry?.path === path) {
          return site.url(page.data.url);
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

    // Ensure the CMS middleware is the first one to be executed
    const server = site.getServer();
    server.addEventListener(
      "start",
      () => {
        server.useFirst(middleware);
      },
      { once: true },
    );

    // Show the CMS in the debugbar
    function showCMS() {
      const item = site.debugBar?.buildItem(
        `CMS running at <a href="${baseUrl}">${baseUrl}</a>`,
        "lume cms",
      );
      if (item) {
        site.debugBar?.action({
          text: "Edit page",
          icon: "pencil-simple",
          onclick: `window.open("${baseUrl}?edit=" + decodeURIComponent(document.location), "_top");`,
        });
      }
    }
    site.addEventListener("beforeBuild", showCMS);
    site.addEventListener("beforeUpdate", showCMS);

    server.addEventListener(
      "start",
      () => {
        log.info("\n  Lume CMS started at:");
        log.info(`  <green>http://${server.hostname}:${server.port}/admin</green>`);
      },
      { once: true },
    );
  };
}

export default lumeCms;
