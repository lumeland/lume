import { read, readFile } from "../core/utils/read.ts";
import { insertContent } from "../core/utils/page_content.ts";
import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";
import { log } from "../core/utils/log.ts";
import { bytes } from "../core/utils/format.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The Share URL of the fonts to download (like `https://fonts.google.com/share?selection.family=...`) */
  fonts: string | Record<string, string>;

  /** The folder to save the fonts */
  fontsFolder?: string;

  /** The CSS file to output the font-face rules */
  cssFile?: string;

  /** A placeholder to replace with the generated CSS */
  placeholder?: string;

  /** The font subsets to download (latin, cyrillic, etc) */
  subsets?: string[];

  /** The subsets to ignore */
  ignoredSubsets?: string[];
}

export const defaults: Options = {
  fonts: "",
};

export function googleFonts(userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    let cssCode = "";
    const cssFile = posix.join("/", options.cssFile || site.options.cssFile);
    const fontsFolder = posix.join(
      "/",
      options.fontsFolder || site.options.fontsFolder,
    );
    const downloadedFonts = new Map<string, number>();

    // Download the fonts and generate the CSS
    site.addEventListener("beforeBuild", async () => {
      const fonts = typeof options.fonts === "string"
        ? { "": options.fonts }
        : options.fonts;
      const relativePath = posix.relative(
        posix.dirname(cssFile),
        posix.join(fontsFolder),
      );

      for (const [name, url] of Object.entries(fonts)) {
        const file = getCssUrl(url);
        if (!file) {
          log.error(`[google_fonts plugin] Invalid URL: ${url}`);
          continue;
        }
        const css = await readFile(file);
        const fontFaces = extractFontFaces(css, name)
          .filter((fontFace) =>
            options.subsets?.includes(fontFace.subset) ?? true
          )
          .filter((fontFace) =>
            !(options.ignoredSubsets?.includes(fontFace.subset) ?? false)
          );

        await Promise.all(fontFaces.map(async (fontFace) => {
          const content = await read(fontFace.src, true);
          const url = posix.join("/", fontsFolder, fontFace.file);
          downloadedFonts.set(url, content.length);
          site.page({
            content,
            url,
          });
        }));

        cssCode += generateCss(fontFaces, relativePath);
      }
    }, { once: true });

    // Output the CSS file
    site.process(async function processGoogleFonts() {
      const page = await site.getOrCreatePage(cssFile);
      page.text = insertContent(page.text, cssCode, options.placeholder);
      const item = site.debugBar?.buildItem(
        `[google_fonts plugin] Fonts downloaded and CSS generated at <code>${cssFile}</code>`,
      );
      if (item) {
        item.items = [...downloadedFonts.entries()]
          .map(([file, size]) => ({
            title: file,
            details: bytes(size),
          }));
      }
    });
  };
}

export default googleFonts;

interface FontFace {
  family: string;
  style: string;
  weight: string;
  stretch?: string;
  src: string;
  file: string;
  range: string;
  subset: string;
}

function extractFontFaces(css: string, name: string): FontFace[] {
  const fontFaces = css.match(/(\/\*[^*]+\*\/)?[\s]+@font-face {[^}]+}/g) || [];

  let unnamedSubsetId = 1;
  return fontFaces.map((fontFace) => {
    let subset = fontFace.match(/\/\* ([^*]+) \*\//)?.[1];
    let family = fontFace.match(/font-family: '([^']+)'/)?.[1];
    const style = fontFace.match(/font-style: ([^;]+);/)?.[1];
    const weight = fontFace.match(/font-weight: ([^;]+);/)?.[1];
    const stretch = fontFace.match(/font-stretch: ([^;]+);/)?.[1];
    const src = fontFace.match(/src: url\('?([^']+)'?\)/)?.[1];
    const range = fontFace.match(/unicode-range: ([^;]+);/)?.[1];

    if (!subset) {
      subset = `[${unnamedSubsetId}]`;
      unnamedSubsetId++;
    }

    if (!family || !style || !weight || !src || !range) {
      throw new Error("Invalid font-face");
    }

    if (name) {
      family = name;
    }

    const file = getFontName([family, stretch, style, weight, subset]);

    return {
      subset,
      family,
      style,
      weight,
      stretch,
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
  font-family: "${fontFace.family}";
  font-style: ${fontFace.style};
  font-weight: ${fontFace.weight};
  font-stretch: ${fontFace.stretch ?? "normal"};
  src: url("${posix.join(fontsFolder, fontFace.file)}") format("woff2");
  unicode-range: ${fontFace.range};
  font-display: swap;
}
`;
  }).join("\n");
}

function getCssUrl(fonts: string): string | undefined {
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
      return;
    }
    const apiUrl = new URL("https://fonts.googleapis.com/css2");
    selection.split("|").forEach((family) => {
      apiUrl.searchParams.append("family", family);
    });
    return apiUrl.href;
  }
}

function getFontName(parts: (string | undefined)[]): string {
  const name = parts
    .filter((part) => part !== undefined)
    .map((part) => part.replace(" ", "-").replaceAll(/[^\w-\[\]]/g, ""))
    .join("-");
  return name.replaceAll(" ", "_").toLowerCase() + ".woff2";
}
