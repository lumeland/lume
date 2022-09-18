import { assertSnapshot } from "../deps/snapshot.ts";
import lume from "../mod.ts";
import { fromFileUrl, join } from "../deps/path.ts";
import { printError } from "../core/errors.ts";

import type { Page, Site, SiteOptions } from "../core.ts";

const cwUrl = import.meta.resolve("./");
const cwd = fromFileUrl(import.meta.resolve("./"));

export function getPath(path: string): string {
  return join(cwd, path);
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: Partial<SiteOptions> = {},
  pluginOptions = {},
): Site {
  options.cwd = getPath("assets");
  options.quiet = true;

  const site = lume(options, pluginOptions, false);

  return site;
}

/** Returns a generated page by src path */
export function getPage(site: Site, path: string) {
  const page = site.pages.find((page) => page.src.path === path);

  if (!page) {
    throw new Error(`Page "${path}" not found`);
  }

  return page;
}

/** Build a site and print errors */
export async function build(site: Site) {
  // Don't save the site to disk
  site.addEventListener("beforeSave", () => false);

  try {
    await site.build();
  } catch (error) {
    printError(error);
    throw error;
  }
}

/** Get the version of a dependency */
export async function getDepVersion(
  file: string,
  name: string,
): Promise<string | undefined> {
  const filepath = join(cwd, `../deps/${file}`);
  const content = await Deno.readTextFile(filepath);
  const match = content.match(`${name}@([^\/]+)`);

  if (match) {
    return match[1];
  }
}

function normalizeContent(
  content: string | Uint8Array | undefined,
): string | undefined {
  if (content instanceof Uint8Array) {
    return `Uint8Array(${content.length})`;
  }
  if (typeof content === "string") {
    // Normalize line ending for Windows
    return content
      .replaceAll("\r\n", "\n")
      .replaceAll(/base64,[^"]+/g, "base64,(...)");
  }
}

async function assertPageSnapshot(
  context: Deno.TestContext,
  page: Page,
) {
  let { data } = page;
  const { dest, src, content } = page;

  // Sort data alphabetically
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
  data = Object.fromEntries(entries);

  await assertSnapshot(context, { src, dest, data, content });
}

export async function assertSiteSnapshot(
  context: Deno.TestContext,
  site: Site,
) {
  const { pages, files } = site;

  // Test number of pages
  await assertSnapshot(context, pages.length);

  // To-do: test site configuration
  await assertSnapshot(
    context,
    {
      formats: Array.from(site.formats.entries.values()).map((format) => {
        return {
          ...format,
          engines: format.engines?.length,
        };
      }),
    },
  );

  // Sort pages and files alphabetically
  pages.sort((a, b) => {
    return compare(a.src.path, b.src.path) || compare(a.dest.path, b.dest.path);
  });

  files.sort((a, b) => {
    return compare(a.src, b.src);
  });

  // Normalize some dynamic data
  pages.forEach((page) => {
    // Normalize data
    if (page.data.date instanceof Date) {
      page.data.date = new Date(0);
    }
    // Ignore comp object
    if (page.data.comp) {
      page.data.comp = {};
    }
    // Remove page reference
    page.data.page = undefined;

    // Remove pagination results details from the data
    if (Array.isArray(page.data.results)) {
      page.data.results = page.data.results.length;
    }
    // Remove alternates values (added by multilanguage plugin)
    if (page.data.alternates) {
      page.data.alternates = Object.keys(
        page.data.alternates as Record<string, Page>,
      );
    }
    // Remote base path because it's different in the test environment
    page.src.remote = page.src.remote?.replace(cwUrl, "");
    delete page.src.created;
    delete page.src.lastModified;

    // Normalize content for Windows
    page.content = normalizeContent(page.content);
    page.data.content = normalizeContent(
      page.data.content as string | Uint8Array | undefined,
    );

    // Source maps
    if (page.dest.ext === ".map") {
      page.content = "(removed for testing)";
      page.data.content = "(removed for testing)";
    }
  });

  // Test static files
  await assertSnapshot(
    context,
    files.map((file) => {
      // Remote base path because it's different in the test environment
      file.remote = file.remote?.replace(cwUrl, "");
      return file;
    }),
  );

  // Test pages
  for (const page of pages) {
    await assertPageSnapshot(context, page);
  }
}

function compare(a: string, b: string): number {
  return a > b ? 1 : a < b ? -1 : 0;
}
