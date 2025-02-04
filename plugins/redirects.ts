import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The redirects output format */
  output?: "html" | "json" | "netlify" | "vercel" | OutputStrategy;

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
  output: "html",
  defaultStatus: 301,
};

/** Predefined output strategies */
const outputs: Record<string, OutputStrategy> = {
  html,
  json,
  netlify,
  vercel,
};

/**
 * A plugin to create redirections
 * @see https://lume.land/plugins/redirects/
 */
export function redirects(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process("*", (pages) => {
      const redirects: Redirect[] = [];

      pages.forEach((page) => {
        const { url, oldUrl } = page.data;

        if (url && oldUrl) {
          const oldUrls = Array.isArray(oldUrl) ? oldUrl : [oldUrl];

          for (const old of oldUrls) {
            const redirect = parseRedirection(
              url,
              old,
              options.defaultStatus,
              site,
            );
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

      redirects.sort((a, b) => a[0].localeCompare(b[0]));

      return outputFn(redirects, site);
    });
  };
}

const validStatusCodes = [301, 302, 303, 307, 308];

function parseRedirection(
  newUrl: string,
  oldUrl: string,
  defaultCode: Status,
  site: Site,
): [string, string, Status] | undefined {
  // Resolve the full URL when the site's base URL is not at the root
  const to = site.url(newUrl);

  const [from, code] = oldUrl.split(/\s+/);
  const parsedCode = code ? parseInt(code) : defaultCode;

  if (!validStatusCodes.includes(parsedCode)) {
    log.error(
      `Invalid status code for redirection from ${from} to ${newUrl} (${code}).`,
    );
    return;
  }

  return [from, to, parsedCode as Status];
}

/** HTML redirect */
function html(redirects: Redirect[], site: Site): void {
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
    const page = Page.create({ url, content, isRedirect: true });
    site.pages.push(page);
  }
}

/** JSON redirect (to use with redirect middleware) */
function json(redirects: Redirect[], site: Site): void {
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
}

/** Netlify redirect */
async function netlify(redirects: Redirect[], site: Site): Promise<void> {
  const content = redirects.map(([from, to, code]) => `${from} ${to} ${code}`)
    .join("\n");
  const page = await site.getOrCreatePage("_redirects");
  page.content = content;
}

/** Vercel redirect */
async function vercel(redirects: Redirect[], site: Site): Promise<void> {
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
}

export default redirects;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * The old url(s) of a page
       * @see https://lume.land/plugins/redirects/
       */
      oldUrl?: string | string[];
    }
  }
}
