import lume from "../mod.ts";
import { Page, Site, SiteOptions } from "../core.ts";
import { printError } from "../cli/utils.ts";

const cwd = new URL("./assets", import.meta.url).pathname;

/** Create a new lume site using the "assets" path as cwd */
export function getSite(options: Partial<SiteOptions> = {}) {
  options.cwd = cwd;

  return lume(options);
}

/** Returns a generated page by src path */
export function getPage(site: Site, path: string) {
  const page = site.pages.find((page) => page.src.path === path);

  if (!page) {
    throw new Error(`Page "${path}" not found`);
  }

  return page;
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
    await site.build(false);
  } catch (error) {
    printError(error);
    throw error;
  }
}
