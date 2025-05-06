import { decapUrl, serverUrl } from "../deps/decap.ts";
import { Page } from "../core/file.ts";
import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";
import { stringify } from "../deps/yaml.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Force the local_backend option. By default is detected automatically. */
  local?: boolean;

  /** Path of a CSS file with custom styles for the preview */
  previewStyle?: string;

  /** Directory path of the admin (by default /admin/) */
  path?: string;

  /** Data key of the configuration */
  configKey?: string;

  /** Whether use a identity method */
  identity?: "netlify";

  /** Custom HTML code to append in the index.html page */
  extraHTML?: string;

  /** Command to run the proxy server */
  proxyCommand?: string;
}

export const defaults: Options = {
  local: undefined,
  path: "/admin/",
  configKey: "decap_cms",
  extraHTML: "",
  proxyCommand:
    `deno run --allow-read --allow-net=0.0.0.0 --allow-write --allow-env ${serverUrl}`,
};

/**
 * A plugin to use Decap CMS in Lume easily
 * @see https://lume.land/plugins/decap_cms/
 */
export function decapCMS(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const local_backend = typeof options.local === "boolean"
      ? options.local
      : site.options.location.hostname === "localhost";

    // Run the local netlify server
    if (local_backend) {
      site.addEventListener("afterStartServer", () => {
        site.run(options.proxyCommand);
      });
    }

    // Create the admin HTML page
    const configUrl = posix.join(options.path, "config.yml");
    const code: string[] = [];
    code.push(
      `<link href="${
        site.url(configUrl)
      }" type="text/yaml" rel="cms-config-url">`,
    );
    code.push(
      `<script src="${decapUrl}"></script>`,
    );

    if (options.identity === "netlify") {
      code.push(
        `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>`,
      );
    }

    if (options.extraHTML) {
      code.push(options.extraHTML);
    }

    if (options.previewStyle) {
      code.push(
        `<script>CMS.registerPreviewStyle("${
          site.url(options.previewStyle)
        }");</script>`,
      );
    }

    // Register the page
    site.page({
      url: posix.join(options.path, "index.html"),
      unlisted: true,
      content: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin</title>
      </head>
      <body>
        ${code.join("")}
      </body>
      </html>
      `,
    });

    // Create the configuration file
    site.process((_, allPages) => {
      const config = site.source.data.get("/")?.[options.configKey] as
        | Record<string, unknown>
        | undefined;

      if (!config) {
        throw new Error(
          `Missing configuration for Netlify CMS: ${options.configKey}`,
        );
      }

      allPages.push(Page.create({
        url: configUrl,
        content: stringify({
          ...config,
          site_url: site.options.location.href,
          local_backend,
        }),
      }));

      // Redirect to the admin page from the home page if the URL has a token
      if (options.identity === "netlify") {
        const homePage = site.pages.find((page) => page.data.url === "/");
        const document = homePage?.document;

        if (document) {
          const script = document.createElement("script");
          script.innerHTML =
            `if (document.location.hash.startsWith("#invite_token=") || document.location.hash.startsWith("#recovery_token=")) { document.location = "${
              site.url(options.path)
            }" + document.location.hash; }`;
          document.head.appendChild(script);
        }
      }
    });
  };
}

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * Decap CMS configuration
       * @see https://lume.land/plugins/decap_cms/
       */
      decap_cms: Record<string, unknown>;
    }
  }
}

export default decapCMS;
