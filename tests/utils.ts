import lume from "../mod.ts";
import { Emitter, OnDemand, Page, Site, SiteOptions } from "../core.ts";
import { printError } from "../cli/utils.ts";

const cwd = new URL("./assets", import.meta.url).pathname;

// Emitter that doesn't save anything for testing purposes
class TestEmitter implements Emitter {
  savePage() {
    return Promise.resolve();
  }

  copyFile() {
    return Promise.resolve();
  }

  clear() {
    return Promise.resolve();
  }
}

/** Create a new lume site using the "assets" path as cwd */
export function getSite(options: Partial<SiteOptions> = {}): Site {
  options.cwd = cwd;

  const site = lume(options, {}, false);
  site.emitter = new TestEmitter();

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
