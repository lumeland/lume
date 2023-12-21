import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The redirects output format */
  output?: "json" | "netlify" | "vercel" | "html" | OutputStrategy;

  /** The default status code to use */
  defaultStatus?: Status;
}

type Status = 301 | 302 | 307 | 308;
type Redirect = [string, string, Status];
type OutputStrategy = (
  redirects: Redirect[],
  site: Site,
) => Promise<void> | void;

export const defaults: Options = {
  output: "json",
  defaultStatus: 301,
};

/** Export strategies */

const outputs: Record<string, OutputStrategy> = {
  async netlify(redirects: Redirect[], site: Site) {
    const content = redirects.map(([from, to, code]) => `${from} ${to} ${code}`)
      .join("\n");
    const page = await site.getOrCreatePage("_redirects");
    page.content = content;
  },

  async vercel(redirects: Redirect[], site: Site) {
    const config = {
      redirects: redirects.map(([source, destination, statusCode]) => ({
        source,
        destination,
        statusCode,
      })),
    };

    const page = await site.getOrCreatePage("vercel.json");
    const content = JSON.parse(page.content as string | undefined || "{}");
    Object.assign(content, config);
    page.content = JSON.stringify(content, null, 2);
  },
  html(redirects: Redirect[], site: Site) {
    for (const [url, to, statusCode] of redirects) {
      const timeout = (statusCode === 301 || statusCode === 308) ? 0 : 1;
      const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <meta http-equiv="refresh" content="${timeout}; url=${to}">
</head>
<body>
  <h1>Redirecting…</h1>
  <a href="${to}">Click here if you are not redirected.</a>
</body>
</html>`;
      const page = Page.create({ url, content });
      site.pages.push(page);
    }
  },
  json(redirects: Redirect[], site: Site) {
    const obj = Object.fromEntries(
      redirects.map((
        [from, to, code],
      ) => [from, code === 301 ? to : { to, code }]),
    );
    const page = Page.create({
      url: "_redirects.json",
      content: JSON.stringify(obj, null, 2),
    });
    site.pages.push(page);
  },
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process("*", (pages) => {
      const redirects: Redirect[] = [];

      pages.forEach((page) => {
        const { url, oldUrl } = page.data;

        if (url && oldUrl) {
          const oldUrls = Array.isArray(oldUrl) ? oldUrl : [oldUrl];

          for (const old of oldUrls) {
            const redirect = parseRedirection(url, old, options.defaultStatus);
            if (redirect) {
              redirects.push(redirect);
            }
          }
        }
      });

      if (!redirects.length) {
        return;
      }

      const outputFn = typeof options.output === "string"
        ? outputs[options.output]
        : options.output;

      if (!outputFn) {
        log.error(`[redirects] Invalid output format: ${options.output}`);
        throw new Error(`Invalid output format: ${options.output}`);
      }

      return outputFn(redirects, site);
    });
  };
}

const validStatusCodes = [301, 302, 303, 307, 308];

function parseRedirection(
  newUrl: string,
  oldUrl: string,
  defaultCode: Status,
): [string, string, Status] | undefined {
  const [from, code] = oldUrl.split(/\s+/);
  const parsedCode = code ? parseInt(code) : defaultCode;

  if (!validStatusCodes.includes(parsedCode)) {
    log.error(
      `Invalid status code for redirection from ${from} to ${newUrl} (${code}).`,
    );
    return;
  }

  return [from, newUrl, parsedCode as Status];
}
