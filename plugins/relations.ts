import { merge } from "../core/utils.ts";

import type { Data, Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The field name used to save the page id */
  idKey: string;

  /** The field name used to save the page type */
  typeKey: string;

  /** The foreign keys per type (type => foreign_key) */
  foreignKeys: Record<string, string>;

  /** Whether expose the whole page or only its data */
  onlyData: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  idKey: "id",
  typeKey: "type",
  foreignKeys: {},
  onlyData: true,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, index);
  };

  function index(page: Page, pages: Page[]) {
    const { data } = page;

    // Save external pages by foreign key
    for (
      const [relType, relForeignKey] of Object.entries(options.foreignKeys)
    ) {
      const id = data[relForeignKey];
      if (Array.isArray(id)) {
        data[relType] = id.map((id) => getPage(pages, relType, id));
      } else if (id) {
        data[relType] = getPage(pages, relType, data[relForeignKey]);
      }
    }

    // Direct relation: Get the type and foreing key of this page
    const type = data[options.typeKey] as string | undefined;
    const foreignKey = type ? options.foreignKeys[type] : undefined;
    const id = data[options.idKey];

    if (!type || !foreignKey || !id) {
      return;
    }

    // Reverse relation: Search pages related with this page
    const relations: Record<string, (Page | Data)[]> = {};

    pages.forEach((page) => {
      const relId = page.data[foreignKey];
      const relType = page.data[options.typeKey] as string | undefined;

      if (!relId || !relType) {
        return;
      }

      if (Array.isArray(relId)) {
        if (!relId.includes(id)) {
          return;
        }
      } else if (relId != id) {
        return;
      }

      if (!relations[relType]) {
        relations[relType] = [];
      }
      relations[relType].push(options.onlyData ? page?.data : page);
    });

    for (const [name, pages] of Object.entries(relations)) {
      data[name] = pages;
    }
  }

  function getPage(
    pages: Page[],
    type: string,
    id: unknown,
  ): Page | Data | undefined {
    const page = pages.find((page) =>
      page.data[options.typeKey] === type && page.data[options.idKey] == id
    );
    if (!page) {
      console.log(`Page not found: type=${type} id=${id}`);
    }

    return options.onlyData ? page?.data : page;
  }
}
