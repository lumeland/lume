import type Site from "../core/site.ts";

import { merge } from "../core/utils/object.ts";
import { isUrl } from "../core/utils/path.ts";
import { read } from "../core/utils/read.ts";
import { posix } from "../deps/path.ts";
import modifyUrls from "../plugins/modify_urls.ts";

export interface Options {
  /** Domains to download images from */
  origins: string[];

  /** The folder where the images will be saved */
  folder: string;

  /** CSS selector the element needs to match */
  selector: string;
}

export const defaults: Options = {
  origins: [],
  folder: "/_assets",
  selector: "img,source,use",
};

export function downloader(userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.use(modifyUrls({ fn: download }));

    async function download(path: string, _page: Lume.Page, element?: Element) {
      if (
        !isUrl(path) ||
        !options.origins.includes(new URL(path).host) ||
        (element && !element.matches(options.selector))
      ) {
        return path;
      }

      const [pathAndQuery, frag] = path.split("#", 2);

      if (!pathAndQuery) {
        return path;
      }

      const content = await read(path, true);
      const filename = posix.basename(pathAndQuery);
      const hash = await crypto.subtle.digest("SHA-1", content);
      const hashHex = new Uint8Array(hash).toHex();
      const url = posix.join(options.folder, `${hashHex}-${filename}`);

      // site.remoteFile(url, pathAndQuery);

      const page = await site.getOrCreatePage(url);
      page.content = content;
      page.src.ext = posix.extname(path);

      return frag ? `${url}#${frag}` : url;
    }
  };
}

export default downloader;
