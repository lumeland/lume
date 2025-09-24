import { merge } from "../core/utils/object.ts";
import { setEnv } from "../core/utils/env.ts";

import basicAuth from "../middlewares/basic_auth.ts";
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
    if (!cms.options.site.url) {
      cms.options.site.url = site.url("/", true);
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

    // Set the function to return the preview URL
    cms.options.previewUrl ??= function previewUrl(
      path: string,
      data: unknown,
      hasChanged?: boolean,
    ): undefined | string | Promise<string | undefined> {
      if (hasChanged) {
        return new Promise((resolve) => {
          site.addEventListener("idle", () => {
            resolve(previewUrl(path, data));
          }, { once: true });
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
    server.addEventListener("start", () => {
      server.useFirst(middleware);
    }, { once: true });

    // Protect the whole site when using the CMS
    if (cms.options.auth?.method === "basic") {
      const users: [string, string][] = Object.entries(cms.options.auth.users)
        .map(([user, password]) => {
          if (typeof password === "string") {
            return [user, password];
          }
          if (
            password && typeof password === "object" && "password" in password
          ) {
            return [user, password.password as string];
          }
          throw new Error(`Invalid password for user ${user}`);
        });

      server.useFirst(basicAuth({
        users: Object.fromEntries(users),
      }));
    }

    // Show the CMS in the debugbar
    function showCMS() {
      const item = site.debugBar?.buildItem(
        `CMS running at <a href="${baseUrl}">${baseUrl}</a>`,
        "lume cms",
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
