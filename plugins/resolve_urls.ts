import { posix } from "../deps/path.ts";
import { Site } from "../core.ts";
import modifyUrls from "./modify_urls.ts";

/** A plugin to convert links to source files to the final page */
export default function () {
  return (site: Site) => {
    const cache = new Map<string, string>();

    site.addEventListener("beforeUpdate", () => cache.clear());

    site.use(modifyUrls({
      fn(url, page) {
        // It's a pretty url or absolute url, so we don't need to do anything
        if (ignore(url)) {
          return url;
        }

        const [name, rest] = getPathInfo(url);
        const file = posix.resolve(posix.dirname(page.src.path), name);

        if (cache.has(file)) {
          return cache.get(file) + rest;
        }

        try {
          const resolved = file.startsWith("~")
            ? site.url(file)
            : site.url(`~${file}`);

          cache.set(file, resolved);
          return resolved + rest;
        } catch {
          cache.set(file, name);
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
    url.endsWith("/"); // Pretty url
}
