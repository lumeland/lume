import { merge } from "../core/utils/object.ts";
import { filesToPages } from "../core/file.ts";
import navPlugin from "./nav.ts";
import type { Nav, NavData } from "./nav.ts";
import type Site from "../core/site.ts";

import {
  createContainer,
  createEncryption,
  createOPF,
  createTocNcx,
  type EpubType,
  getManifest,
  ManifestItem,
  type Metadata,
  type Property,
} from "./epub/mod.ts";
import { BlobReader, BlobWriter, ZipWriter } from "../deps/zip.ts";

export interface Options {
  /** File to output the .epub file */
  output?: string;

  /** Set true to output also the pages (for debuging purposes) */
  outputUncompressed?: boolean;

  /** Metadata of the book */
  metadata?: Partial<Metadata>;
}

export const defaults: Options = {
  output: "/book.epub",
  outputUncompressed: false,
  metadata: {
    title: "Untitled",
    identifier: "urn:uuid:00000000-0000-0000-0000-000000000000",
    publisher: "Unknown",
    rights: "All rights reserved",
    date: new Date(),
  },
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const metadata = options.metadata as Metadata;
    site.data("metadata", metadata);
    let nav: Nav | undefined = site.scopedData.get("/")?.nav as Nav;

    // Install automatically the nav plugin if it's missing
    if (!nav) {
      site.use(navPlugin());
      nav = site.scopedData.get("/")?.nav as Nav;
    }

    // Convert all .html URLs to .xhtml
    site.preprocess((pages) => {
      for (const page of pages) {
        if (page.outputPath.endsWith(".html")) {
          page.data.url = page.outputPath.replace(".html", ".xhtml");
        }
      }
    });

    // Ensure all xhtml pages have correct syntax
    site.process([".xhtml"], (pages) => {
      for (const page of pages) {
        page.document;
      }
    });

    // Generate the EPUB
    site.process(async () => {
      // Load all static files to include them in the file
      await filesToPages(
        site.files,
        site.pages,
        () => true,
      );

      // Generate the manifestItem object for all pages
      for (const page of site.pages) {
        page.data.manifestItem = getManifest(page.data, metadata);
      }

      // Create the menu tree with all pages sorted by order
      const menu = nav.menu("/", "", "order=asc basename=asc-locale");

      // Create the list of all files to include in the EPUB
      const files = Array.from(
        new Set<ManifestItem>([
          ...allPages(menu),
          ...site.pages.map((page) => page.data.manifestItem as ManifestItem),
        ]),
      );

      // Create the toc.ncx file
      const tocNcxPage = await site.getOrCreatePage("/toc.ncx");
      tocNcxPage.content = createTocNcx(metadata, menu, files);
      tocNcxPage.data.manifestItem = getManifest(
        tocNcxPage.data,
        metadata,
      );
      files.push(tocNcxPage.data.manifestItem);

      // Create the content.opf file
      const contentOpfPage = await site.getOrCreatePage("/content.opf");
      contentOpfPage.content = createOPF(metadata, files);

      // Move all content to the epub/ subfolder
      for (const page of site.pages) {
        page.data.url = `/epub${page.data.url}`;
      }

      // Create the encryption.xml file if there are fonts to embed
      const fonts = site.search.files("**/*.{woff2,woff}");

      if (fonts.length) {
        const encryptionPage = await site.getOrCreatePage(
          "/META-INF/encryption.xml",
        );
        encryptionPage.content = createEncryption(fonts);
      }

      // Create the /mimetype file
      const mimetypePage = await site.getOrCreatePage("/mimetype");
      mimetypePage.content = "application/epub+zip";

      // Create the container.xml file
      const containerPage = await site.getOrCreatePage(
        "/META-INF/container.xml",
      );
      containerPage.content = createContainer("epub/content.opf");

      // Create the EPUB file
      const zipWriter = new ZipWriter(new BlobWriter("application/epub+zip"));

      // Copy the content of all pages to the ZIP
      for (const page of site.pages) {
        await zipWriter.add(
          page.data.url.slice(1),
          new BlobReader(new Blob([page.bytes])),
        );
      }

      // Remove all pages from the site
      if (!options.outputUncompressed) {
        site.pages.splice(0, site.pages.length);
      }

      // Create the .epub file
      const zip = await zipWriter.close();
      const epub = await site.getOrCreatePage(options.output);
      epub.bytes = new Uint8Array(await zip.arrayBuffer());
    });
  };
}

function allPages(menu: NavData): ManifestItem[] {
  const pages: ManifestItem[] = [];

  function traverse(item: NavData) {
    if (item.data.manifestItem) {
      pages.push(item.data.manifestItem as ManifestItem);
    }

    if (item.children) {
      for (const child of item.children) {
        traverse(child);
      }
    }
  }

  if (menu) {
    traverse(menu);
  }

  return pages;
}

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      type?: EpubType;
      index?: boolean;
      id?: string;
      properties?: Property | Property[];
      manifestItem?: ManifestItem;
    }
  }
}
