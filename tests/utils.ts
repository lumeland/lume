import lume from "../mod.ts";
import { join } from "../deps/path.ts";
import { printError } from "../cli/utils.ts";

import type { Page, Site, SiteOptions } from "../core.ts";

const cwd = new URL("./", import.meta.url).pathname;

export function getPath(path: string): string {
  return join(cwd, path);
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(
  options: Partial<SiteOptions> = {},
  pluginOptions = {},
  preventSave = true,
): Site {
  options.cwd = getPath("assets");

  const site = lume(options, pluginOptions, false);

  // Don't save the site to disk
  if (preventSave) {
    site.addEventListener("beforeSave", () => false);
  }

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

/** Check if page exist */
export function pageExists(site: Site, path: string) {
  const page = site.pages.find((page) => page.src.path === path);
  return !!page;
}

/** Test a generated page by src path */
export function testPage(
  site: Site,
  path: string,
  test: (page: Page) => void | Promise<void>,
) {
  const page = getPage(site, path);

  return test(page);
}

/** Build a site and print errors */
export async function build(site: Site) {
  try {
    await site.build();
  } catch (error) {
    printError(error);
    throw error;
  }
}
