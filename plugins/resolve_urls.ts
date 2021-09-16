import { posix } from "../deps/path.ts";
import { Site } from "../core.ts";
import modifyUrls from "./modify_urls.ts";
import { warn } from "../core/utils.ts";

/** A plugin to convert links to source files to the final page */
export default function () {
  return (site: Site) => {
    site.use(modifyUrls({
      fn(url, page) {
        if (
          url.endsWith(".md") || url.includes(".md#") || url.includes(".md?")
        ) {
          const [name, rest] = getPathInfo(url);
          const file = posix.resolve(posix.dirname(page.src.path), name);

          try {
            return site.url(`~/${file}`) + rest;
          } catch (cause) {
            warn("Could not resolve markdown link", {
              name: "Resolve Urls plugin",
              page,
              url,
              cause,
            });
          }
        }

        return url;
      },
    }));
  };
}

/**
 * Split the filename and the extra content (query or hash) from a path
 * Example: "/foo.md?hello=world" => ["/foo.md", "?hello=world"]
 * Example: "/foo.md#hello=world" => ["/foo.md", "#hello=world"]
 */
export function getPathInfo(path: string): [string, string] {
  let file = path, rest = "";

  if (path.includes("?")) {
    [file, rest] = path.split("?", 2);
    rest = `?${rest}`;
  } else if (path.includes("#")) {
    [file, rest] = path.split("#", 2);
    rest = `#${rest}`;
  }

  return [file, rest];
}
