import textLoader from "../loaders/text.js";
import { optimize } from "../deps/svgo.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".svg"],
  options: {},
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadAssets(options.extensions, textLoader);
    site.process(options.extensions, processor);

    async function processor(page) {
      const path = site.src(page.dest.path + page.dest.ext);
      const result = await optimize(page.content, {
        path,
        ...options.options,
      });
      page.content = result.data;
    }
  };
}
