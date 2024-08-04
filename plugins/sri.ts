import { read } from "../core/utils/read.ts";
import { merge } from "../core/utils/object.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** The algorithm used to calculate the cryptographic hash of the file */
  algorithm?: "sha256" | "sha384" | "sha512";

  /** The CORS setting for the file being loaded */
  crossorigin?: "anonymous" | "use-credentials";

  /** The selector to find the elements to add the integrity attribute */
  selector?: string;
}

export const defaults: Options = {
  algorithm: "sha384",
  crossorigin: "anonymous",
  selector: "script[src], link[rel=stylesheet][href]",
};

const cache = new Map<string, string>();

/**
 * A plugin to add the Subresource Integrity (SRI) attribute to the script and link elements
 * @see https://lume.land/plugins/sri/
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const { origin } = site.options.location;

    site.process([".html"], async (pages) => {
      for (const page of pages) {
        const { document } = page;

        if (!document) {
          continue;
        }

        const nodes = document.querySelectorAll(options.selector);

        for (const node of nodes) {
          const element = node as Element;
          const url = element.getAttribute("src") ||
            element.getAttribute("href");

          if (!url || !url.match(/^https?:\/\//) || url.startsWith(origin)) {
            continue;
          }

          const integrity = await getIntegrity(options.algorithm, url);
          element.setAttribute("integrity", integrity);
          element.setAttribute("crossorigin", options.crossorigin);
        }
      }
    });
  };
}

async function getIntegrity(
  algorithm: Options["algorithm"],
  url: string,
): Promise<string> {
  if (cache.has(url)) {
    return cache.get(url)!;
  }

  const data = await read(url, true);
  const hashBuffer = await crypto.subtle.digest(digestName(algorithm), data);
  const base64string = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  const integrity = `${algorithm}-${base64string}`;
  cache.set(url, integrity);
  return integrity;
}

function digestName(algorithm: Options["algorithm"]) {
  switch (algorithm) {
    case "sha256":
      return "SHA-256";
    case "sha384":
      return "SHA-384";
    case "sha512":
      return "SHA-512";
    default:
      return "SHA-384";
  }
}
