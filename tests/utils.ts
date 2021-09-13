import lume from "../mod.ts";
import { Site, SiteOptions } from "../core.ts";

const cwd = new URL("./assets", import.meta.url).pathname;

export function getSite(options: Partial<SiteOptions> = {}) {
  options.cwd ||= cwd;

  return lume(options);
}

export function getPage(site: Site, path: string) {
  const page = site.pages.find((page) => page.src.path === path);

  if (!page) {
    throw new Error(`Page "${path}" not found`);
  }

  return page;
}
