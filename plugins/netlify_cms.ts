import { Page } from "../core/filesystem.ts";
import { merge } from "../core/utils.ts";
import { Exception } from "../core/errors.ts";
import { posix } from "../deps/path.ts";
import { stringify } from "../deps/yaml.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** Force the local_backend option. By default is detected automatically. */
  local?: boolean;

  /** Path of a CSS file with custom styles for the preview */
  previewStyle?: string;

  /** Directory path of the admin (by default /admin/) */
  path: string;

  /** Data key of the configuration */
  configKey: string;

  /** Whether use Netlify Identity */
  netlifyIdentity: boolean;

  /** Custom HTML code to append in the index.html page */
  extraHTML: string;
}

const defaults: Options = {
  local: undefined,
  path: "/admin/",
  configKey: "netlify_cms",
  netlifyIdentity: false,
  extraHTML: "",
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const local_backend = typeof options.local === "boolean"
      ? options.local
      : site.options.location.hostname === "localhost";

    // Run the local netlify server
    if (local_backend) {
      site.addEventListener("afterBuild", () => {
        site.run("npx netlify-cms-proxy-server");
      });
    }

    // Build the admin page
    site.addEventListener("afterRender", () => {
      const root = site.source.root!;
      const config: Record<string, unknown> | undefined = root
        .data[options.configKey] as Record<string, unknown> | undefined;

      if (!config) {
        throw new Exception("Missing configuration for Netlify CMS", {
          key: options.configKey,
        });
      }

      // Create config.yml
      const configUrl = posix.join(options.path, "config.yml");

      site.pages.push(Page.create(
        configUrl,
        stringify({
          ...config,
          site_url: site.options.location.href,
          local_backend,
        }),
      ));

      // Create index.html
      const code = [];
      code.push(
        `<link href="${
          site.url(configUrl)
        }" type="text/yaml" rel="cms-config-url">`,
      );
      code.push(
        `<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>`,
      );

      if (options.netlifyIdentity) {
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
        `
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
      ));
    });
  };
}
