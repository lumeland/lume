import binaryLoader from "../loaders/binary.js";
import { globToRegExp, isGlob } from "../deps/glob.js";
import { resize } from "../deps/image.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".png", ".jpg", ".jpeg"],
  resize: {},
};

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);

  const resizes = [];

  for (const [pattern, versions] of Object.entries(options.resize)) {
    resizes.push([
      isGlob(pattern) ? globToRegExp(pattern) : pattern,
      Object.entries(versions),
    ]);
  }

  return (site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, processor);

    async function processor(page) {
      for (const [pattern, versions] of resizes) {
        if (!matches(page.src.path + page.src.ext, pattern)) {
          continue;
        }

        for (const [suffix, opt] of versions) {
          if (suffix) {
            const newImage = page.duplicate();
            newImage.content = await resize(page.content, opt);
            newImage.dest.path += suffix;
            site.pages.push(newImage);
          } else {
            page.content = await resize(page.content, opt);
          }
        }
      }
    }
  };
}

function matches(path, pattern) {
  return typeof pattern === "string"
    ? path.startsWith(pattern)
    : pattern.test(path);
}
