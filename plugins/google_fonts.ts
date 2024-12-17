import { read, readFile } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";
import { posix } from "../deps/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** The Share URL of the fonts to download (like `https://fonts.google.com/share?selection.family=...`) */
  fonts: string | Record<string, string>;

  /** The folder to save the fonts */
  folder?: string;

  /** The CSS file to output the font-face rules */
  cssFile?: string;

  /** A placeholder to replace with the generated CSS */
  placeholder?: string;

  /** The font subsets to download (latin, cyrillic, etc) */
  subsets?: string[];
}

export const defaults: Options = {
  fonts: "",
  folder: "/fonts",
  cssFile: "/fonts.css",
  placeholder: "",
};

export function googleFonts(userOptions: Options) {
  const options = { ...defaults, ...userOptions } as Required<Options>;

  return (site: Site) => {
    let cssCode = "";
    const cssFile = posix.join("/", options.cssFile);

    site.addEventListener("beforeBuild", async () => {
      const fonts = typeof options.fonts === "string"
        ? { "": options.fonts }
        : options.fonts;
      const relativePath = posix.relative(
        posix.dirname(cssFile),
        posix.join(options.folder),
      );

      for (const [name, url] of Object.entries(fonts)) {
        const css = await readFile(getCssUrl(url));
        const fontFaces = extractFontFaces(css, name)
          .filter((fontFace) =>
            options.subsets?.includes(fontFace.subset) ?? true
          );

        await Promise.all(fontFaces.map(async (fontFace) => {
          const content = await read(fontFace.src, true);
          site.page({
            content,
            url: posix.join("/", options.folder, fontFace.file),
          });
        }));

        cssCode += generateCss(fontFaces, relativePath);
      }
    });

    // Output the CSS file
    site.addEventListener("afterRender", async () => {
      const page = await site.getOrCreatePage(cssFile);
      insertContent(page, cssCode, options.placeholder);
    });
  };
}

export default googleFonts;

interface FontFace {
  family: string;
  style: string;
  weight: string;
  src: string;
  file: string;
  range: string;
  subset: string;
}

function extractFontFaces(css: string, name: string): FontFace[] {
  const fontFaces = css.match(/\/\*[^*]+\*\/[\s]+@font-face {[^}]+}/g) || [];

  return fontFaces.map((fontFace) => {
    const subset = fontFace.match(/\/\* ([^*]+) \*\//)?.[1];
    let family = fontFace.match(/font-family: '([^']+)'/)?.[1];
    const style = fontFace.match(/font-style: ([^;]+);/)?.[1];
    const weight = fontFace.match(/font-weight: ([^;]+);/)?.[1];
    const src = fontFace.match(/src: url\('?([^']+)'?\)/)?.[1];
    const range = fontFace.match(/unicode-range: ([^;]+);/)?.[1];

    if (!family || !style || !weight || !src || !range || !subset) {
      throw new Error("Invalid font-face");
    }

    if (name) {
      family = name;
    }

    const file = `${family}-${style}-${weight}-${subset}.woff2`.replaceAll(
      " ",
      "_",
    ).toLowerCase();

    return {
      subset,
      family,
      style,
      weight,
      src,
      range,
      file,
    };
  });
}

function generateCss(fontFaces: FontFace[], fontsFolder: string): string {
  return fontFaces.map((fontFace) => {
    return `/* ${fontFace.subset} */
@font-face {
  font-family: '${fontFace.family}';
  font-style: ${fontFace.style};
  font-weight: ${fontFace.weight};
  src: url('${posix.join(fontsFolder, fontFace.file)}') format('woff2');
  unicode-range: ${fontFace.range};
}
`;
  }).join("\n");
}

function getCssUrl(fonts: string): string {
  const url = new URL(fonts);

  // Share URL
  if (url.host === "fonts.googleapis.com" && url.pathname === "/css2") {
    url.searchParams.append("display", "swap");
    return url.href;
  }

  // Selection URL
  if (url.host === "fonts.google.com" && url.pathname === "/share") {
    const selection = url.searchParams.get("selection.family");
    if (!selection) {
      throw new Error("Invalid Google Fonts URL");
    }
    const apiUrl = new URL("https://fonts.googleapis.com/css2");
    selection.split("|").forEach((family) => {
      apiUrl.searchParams.append("family", family);
    });
    return apiUrl.href;
  }

  throw new Error(`Invalid Google Fonts URL: ${fonts}`);
}
