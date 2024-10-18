import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";

import type Site from "../core/site.ts";

export interface Options {
  /**
   * Hatsu instance URL.
   *
   * @default
   * ```ts
   * new URL('https://hatsu.local')
   * ```
   */
  instance: URL;
  /**
   * Match routes.
   *
   * @default
   * ```ts
   * [/^\/posts\/(.+)$/]
   * ```
   */
  matches?: (RegExp | string)[];
  /**
   * Whether to copy `/.well-known/` files.
   * @default `undefined`
   */
  wellKnown?: false;
}

// Default options
export const defaults: Options = {
  instance: new URL("https://hatsu.local"),
  matches: [/^\/posts\/(.+)$/],
};

export default (userOptions: Options) => {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (options.matches) {
      site.process([".html"], (pages) =>
        pages.forEach((page) => {
          if (
            page.document &&
            (options.matches.some((match) =>
              match instanceof RegExp
                ? page.data.url.match(match)
                : page.data.url.includes(match)
            ))
          ) {
            const link = page.document.createElement("link");
            link?.setAttribute("rel", "alternate");
            link?.setAttribute("type", "application/activity+json");
            link?.setAttribute(
              "href",
              new URL(
                `/posts/${new URL(page.data.url, site.options.location).href}`,
                options.instance,
              ).href,
            );
            page.document.head.appendChild(link);
          }
        }));
    }

    // copy .well-known files
    if (options.wellKnown !== false) {
      site.addEventListener("beforeRender", async ({ pages }) => {
        pages.push(
          // webfinger (with search params)
          Page.create({
            url: "/.well-known/webfinger",
            content: await read(
              new URL(
                `/.well-known/webfinger?resource=acct:${site.options.location.host}@${options.instance.host}`,
                options.instance,
              ).href,
              false,
            ),
          }),
          // nodeinfo & host-meta
          ...await Promise.all(
            ["nodeinfo", "host-meta", "host-meta.json"]
              .map(async (file) =>
                Page.create({
                  url: `/.well-known/${file}`,
                  content: await read(
                    new URL(`/.well-known/${file}`, options.instance).href,
                    false,
                  ),
                })
              ),
          ),
        );
      });
    }
  };
};
