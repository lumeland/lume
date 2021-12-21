import { posix } from "../deps/path.ts";
import modifyUrls from "./modify_urls.ts";
import { normalizePath } from "../core/utils.ts";

import type { Site } from "../core.ts";

/** A plugin to convert links to source files to the final page */
export default function () {
  return (site: Site) => {
    const cache = new Map<string, string | null>();

    site.addEventListener("beforeUpdate", () => cache.clear());

    site.use(modifyUrls({
      fn(url, page) {
        // It's a pretty url or absolute url, so we don't need to do anything
        if (ignore(url)) {
          return url;
        }

        let [file, rest] = getPathInfo(url);

        if (!file.startsWith("~")) {
          file = posix.resolve(
            posix.dirname(normalizePath(page.src.path)),
            file,
          );
        }

        if (cache.has(file)) {
          const cached = cache.get(file);
          return cached ? cached + rest : url;
        }

        try {
          const resolved = file.startsWith("~")
            ? site.url(file)
            : site.url(`~${file}`);

          cache.set(file, resolved);
          return resolved + rest;
        } catch {
          cache.set(file, null);
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

function ignore(url: string) {
  return !url ||
    url.startsWith("?") ||
    url.startsWith("#") ||
    url.startsWith("data:") ||
    url.includes("//") ||
    (url.endsWith("/") && !url.startsWith("~")); // Pretty url
}
