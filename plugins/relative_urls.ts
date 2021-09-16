import { posix } from "../deps/path.ts";
import { Site } from "../core.ts";
import modifyUrls from "./modify_urls.ts";

/** A plugin to convert all internal URLs to relative */
export default function () {
  return (site: Site) => {
    const basePath = site.options.location.pathname;

    site.use(modifyUrls({
      fn(url, page) {
        if (!url.startsWith("/") || url.startsWith("//")) {
          return url;
        }

        if (!url.startsWith(basePath)) {
          url = posix.join(basePath, url);
        }

        const from = site.url(page.data.url as string);
        return posix.relative(from, url);
      },
    }));
  };
}
