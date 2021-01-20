import textLoader from "../loaders/text.js";

const defaults = {
  extensions: [".ts", ".js"],
  options: {},
};

export default function (options = {}) {
  const userOptions = { ...defaults, ...options };
  const emitOptions = { ...defaults.options, ...options.options };

  return (site) => {
    site.loadAssets(userOptions.extensions, textLoader);
    site.process(userOptions.extensions, processor);

    async function processor(page) {
      const from = site.src(page.src.path + page.src.ext);
      const { files } = await Deno.emit(from, {
        ...emitOptions,
        sources: {
          [from]: page.content,
        },
      });

      console.log(files);
      // page.content = emit;
      page.dest.ext = ".js";
    }
  };
}
