import { optimize } from "../deps/svgo.ts";
import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

interface Options {
  extensions: string[];
  options: Partial<SvgoOptions>;
}

interface SvgoOptions {
  multipass: boolean;
  plugins: unknown[];
  datauri: "base64" | "enc" | "unenc";
  js2svg: {
    doctypeStart?: string;
    doctypeEnd?: string;
    procInstStart?: string;
    procInstEnd?: string;
    tagOpenStart?: string;
    tagOpenEnd?: string;
    tagCloseStart?: string;
    tagCloseEnd?: string;
    tagShortStart?: string;
    tagShortEnd?: string;
    attrStart?: string;
    attrEnd?: string;
    commentStart?: string;
    commentEnd?: string;
    cdataStart?: string;
    cdataEnd?: string;
    textStart?: string;
    textEnd?: string;
    indent?: number;
    regEntities?: RegExp;
    regValEntities?: RegExp;
    encodeEntity?: (char: string) => string;
    pretty?: boolean;
    useShortTags?: boolean;
  };
}

// Default options
const defaults: Options = {
  extensions: [".svg"],
  options: {},
};

/** A plugin to load all SVG files and minify them using SVGO */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, svg);

    async function svg(page: Page) {
      const path = site.src(page.dest.path + page.dest.ext);
      const result = await optimize(page.content, {
        path,
        ...options.options,
      }) as { data: string };

      page.content = result.data;
    }
  };
}
