import { optimize } from "../deps/svgo.js";
import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".svg"],
  options: {},
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, svg);

    async function svg(page) {
      const path = site.src(page.dest.path + page.dest.ext);
      const result = await optimize(page.content, {
        path,
        ...options.options,
      });
      page.content = result.data;
    }
  };
}
