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
    "deno run --allow-read --allow-net=0.0.0.0 --allow-write --allow-env npm:decap-server",
};

/** A plugin to use Decap CMS in Lume easily */
export default function (userOptions?: Options) {
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

    // Build the admin page
    site.addEventListener("afterRender", () => {
      const config = site.source.data.get("/")?.[options.configKey] as
        | Record<string, unknown>
        | undefined;

      if (!config) {
        throw new Error(
          `Missing configuration for Netlify CMS: ${options.configKey}`,
        );
      }

      // Create config.yml
      const configUrl = posix.join(options.path, "config.yml");

      site.pages.push(Page.create(
        configUrl,
        {
          content: stringify({
            ...config,
            site_url: site.options.location.href,
            local_backend,
          }),
        },
      ));

      // Create index.html
      const code = [];
      code.push(
        `<link href="${
          site.url(configUrl)
        }" type="text/yaml" rel="cms-config-url">`,
      );
      code.push(
        `<script src="https://unpkg.com/decap-cms@3.0.12/dist/decap-cms.js"></script>`,
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

      site.pages.push(Page.create(
        posix.join(options.path, "index.html"),
        {
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
        },
      ));
    });
  };
}

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /**
       * Decap CMS configuration
       * @see https://lume.land/plugins/decap_cms/
       */
      decap_cms: Record<string, unknown>;
    }
  }
}
