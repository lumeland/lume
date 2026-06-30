import { merge } from "../core/utils/object.ts";
import { getDataValue, getPlainDataValue } from "../core/utils/data_values.ts";
import { Page } from "../core/file.ts";
import { log } from "../core/utils/log.ts";
import { buildIcon } from "../core/utils/image.ts";

import type Site from "../core/site.ts";

export interface AppData {
  /** Name of the app */
  name: string;

  /** Short version of the name */
  short_name?: string;

  /** Unique identifier */
  id?: string;

  /** Additional search params for the URL. Example `pwa=1` */
  search_params?: string;

  /** App description */
  description?: string;

  /** App icon (SVG preferred) */
  icon?: string;

  /** Display configuration */
  display?: string | string[];

  /** App main color */
  color?: string;

  /** App background color */
  background?: string;

  /** List of categories */
  categories?: string[];
}
export interface ShortcutData {
  /** Name of the app */
  name: string;

  /** Short version of the name */
  short_name: string;

  /** Additional search params for the URL. Example `pwa=1` */
  search_params?: string;

  /** App description */
  description: string;
}

export interface Options {
  output?: string;
}

// Default options
export const defaults = {
  output: "/manifest.json",
} satisfies Options;

export function pwa(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const { cache } = site;

    /* Copied from favicon */
    async function getContent(
      file: string,
    ): Promise<Uint8Array | string | undefined> {
      const content = file.endsWith(".svg")
        ? await site.getContent(file, false)
        : await site.getContent(file, true);

      if (!content) {
        log.warn(`[pwa plugin] Input file not found: ${file}`);
      }

      return content;
    }

    site.process([".html"], async (pages) => {
      const manifest: Partial<Manifest> = {};
      const shortcuts: Shortcut[] = [];

      for (const page of pages) {
        const { data } = page;
        const app = data.app as AppData | undefined;

        if (app) {
          const url = site.url(page.data.url, true);
          const search_params = getPlainDataValue(data, app.search_params);
          const displayModes = getDataValue(data, app.display) ??
            ["standalone", "minimal-ui"];

          manifest.start_url = search_params ? `${url}?${search_params}` : url;
          manifest.scope = site.url("/");
          manifest.id = getPlainDataValue(data, app.id) ?? search_params
            ? url
            : undefined;
          manifest.name = getPlainDataValue(data, app.name);
          manifest.short_name = getPlainDataValue(data, app.short_name);
          manifest.description = getPlainDataValue(data, app.description);
          manifest.display_override = displayModes;
          manifest.display = "browser";
          manifest.theme_color = getDataValue(data, app.color);
          manifest.background_color = getDataValue(data, app.background);
          manifest.categories = getDataValue(data, app.categories);
          const icon = getDataValue(data, app.icon);
          const content = icon ? await getContent(icon) : undefined;

          if (content) {
            // Both 192×192 and 512×512 are required for Chromium-based browsers to trigger the beforeinstallprompt event.
            manifest.icons = [
              {
                sizes: "192x192",
                src: "/pwa-icon-192.png",
                type: "image/png",
              },
              {
                sizes: "512x512",
                src: "/pwa-icon-512.png",
                type: "image/png",
              },
            ];

            site.pages.push(Page.create({
              url: "/pwa-icon-192.png",
              content: await buildIcon(content, "png", [192], cache),
            }));

            site.pages.push(Page.create({
              url: "/pwa-icon-512.png",
              content: await buildIcon(content, "png", [512], cache),
            }));
          }
          continue;
        }

        const shortcut = data.shortcut as ShortcutData | undefined;
        if (shortcut) {
          const url = site.url(page.data.url, true);
          const search_params = getPlainDataValue(data, shortcut.search_params);

          shortcuts.push({
            name: getPlainDataValue(data, shortcut.name),
            short_name: getPlainDataValue(data, shortcut.short_name),
            description: getPlainDataValue(data, shortcut.description),
            url: search_params ? `${url}?${search_params}` : url,
          });
        }
      }

      if (shortcuts.length) {
        manifest.shortcuts = shortcuts;
      }

      const manifestFile = await site.getOrCreatePage(options.output);
      manifestFile.text = JSON.stringify(manifest, null, 2);
    });
  };
}

export default pwa;

export interface Icon {
  src: string;
  sizes: string;
  type: string;
  purpose?: "monochrome" | "maskable" | "any";
}
export interface Screenshot {
  src: string;
  sizes: string;
  type: string;
  label: string;
  form_factor: "narrow" | "wide";
  platform:
    | "android"
    | "chromeos"
    | "ios"
    | "ipados"
    | "kaios"
    | "windows"
    | "xbox"
    | "chrome_web_store"
    | "itunes"
    | "microsoft-inbox"
    | "microsoft-store"
    | "play";
}

export type DisplayMode =
  | "fullscreen"
  | "standalone"
  | "minimal-ui"
  | "browser"
  | "tabbed"
  | "window-controls-overlay";

export type ClientMode =
  | "auto"
  | "focus-existing"
  | "navigate-existing"
  | "navigate-new";

export type Orientation =
  | "any"
  | "natural"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape"
  | "landscape-primary"
  | "landscape-secondary";

export interface FileHandler {
  action: string;
  accept: Record<string, string[]>;
}

export interface ProtocolHandler {
  protocol: string;
  url: string;
}

export interface File {
  name: string;
  accept: string | string[];
}

export interface Shortcut {
  name: string;
  url: string;
  short_name?: string;
  description?: string;
  icons?: Icon[];
}

export interface Manifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: DisplayMode;
  display_override: DisplayMode[];
  theme_color: string;
  background_color: string;
  categories: string[];
  icons: Icon[];
  screenshots: Screenshot[];
  file_handlers: FileHandler[];
  protocol_handlers: ProtocolHandler[];
  launch_handler: {
    client_mode: ClientMode[];
  };
  share_target: {
    action: string;
    enctype: string;
    method: "GET" | "POST";
    params: {
      title: string;
      text: string;
      url: string;
      files: File | File[];
    };
  };
  shortcuts: Shortcut[];
}

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * PWA - Main app
       * @see https://lume.land/plugins/pwa/
       */
      app?: AppData;

      /**
       * PWA - Shortcut
       * @see https://lume.land/plugins/pwa/
       */
      shortcut?: ShortcutData;
    }
  }
}
