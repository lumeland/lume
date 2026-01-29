import {
  imageDimensionsFromData,
  imageDimensionsFromStream,
} from "../deps/image_dimmensions.ts";
import { posix } from "../deps/path.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

interface Dimmensions {
  width: number;
  height: number;
  type: string;
}

export default function imageSize() {
  return (site: Site) => {
    const sizes = new Map<string, Dimmensions | undefined>();

    //Clear cache
    site.addEventListener("beforeUpdate", () => sizes.clear());

    async function getImageSize(
      path: string,
    ): Promise<Dimmensions | undefined> {
      if (sizes.has(path)) {
        return sizes.get(path);
      }

      // It's a loaded page
      const page = site.pages.find((page) => page.data.url === path);
      if (page) {
        const dimmensions = imageDimensionsFromData(page.bytes);
        sizes.set(path, dimmensions);
        return dimmensions;
      }

      // It's a file
      const file = site.files.find((file) => file.data.url === path);
      if (file) {
        using fs = await Deno.open(site.src(file.sourcePath), {
          read: true,
          write: false,
        });
        const dimmensions = await imageDimensionsFromStream(fs.readable);
        sizes.set(path, dimmensions);
        return dimmensions;
      }

      log.error(`[image-size] Unable to get the dimmensions of ${path}`);
    }

    site.process([".html"], async function processImageSize(pages) {
      for (const page of pages) {
        const { document } = page;
        const basePath = posix.dirname(page.outputPath);

        for (const img of document.querySelectorAll("img[image-size]")) {
          const src = img.getAttribute("src");
          if (!src) {
            log.warn(
              `[image-size] Image without src attribute in ${page.data.url}`,
            );
            continue;
          }

          const size = await getImageSize(posix.join(basePath, src));

          if (size) {
            img.setAttribute("width", size.width.toString());
            img.setAttribute("height", size.height.toString());
          }

          img.removeAttribute("image-size");
        }
      }
    });
  };
}

export { imageSize };
