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
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  idKey: "id",
  typeKey: "type",
  foreignKeys: {},
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, index);

    function index(page1: Page, pages: Page[]) {
      const data1 = page1.data;
      const id1 = data1[options.idKey] as string | undefined;
      const type1 = data1[options.typeKey] as string | undefined;
      const foreignKey1 = type1 ? options.foreignKeys[type1] : undefined;

      // Index the current page with the other pages
      pages.forEach(indexPage);

      // Index the current page with previously generated pages (if any)
      site.pages.forEach(indexPage);

      function indexPage(page2: Page) {
        if (page1 === page2) {
          return;
        }

        const data2 = page2.data;
        const id2 = data2[options.idKey] as string | undefined;
        const type2 = data2[options.typeKey] as string | undefined;
        const foreignKey2 = type2 ? options.foreignKeys[type2] : undefined;

        // Page2 has a foreign key to page1
        const directRelation = relate(
          data1,
          data2,
          foreignKey1,
          id1,
          type1,
        );

        // If it was related, do the opposite relation
        if (directRelation && type2) {
          saveMultipleRelation(
            data2,
            data1,
            type2,
          );
          return;
        }

        // Page1 has a foreign key to page2
        const reverseRelation = relate(
          data2,
          data1,
          foreignKey2,
          id2,
          type2,
        );

        // If it was related, do the opposite relation
        if (reverseRelation && type1) {
          saveMultipleRelation(
            data1,
            data2,
            type1,
          );
        }
      }

      function relate(
        rel: Data,
        data: Data,
        foreignKey?: string,
        id?: string,
        type?: string,
      ): boolean {
        if (foreignKey && type && id && data[foreignKey]) {
          const relId = data[foreignKey] as string | string[];

          // The foreign key contain an array
          if (Array.isArray(relId)) {
            if (relId.includes(id)) {
              saveMultipleRelation(rel, data, type);
              return true;
            }
            return false;
          }

          // The foreign key is a single value
          if (relId == id) {
            data[type] = rel;
            return true;
          }
        }

        return false;
      }

      function saveMultipleRelation(rel: Data, data: Data, type: string) {
        const relData = (data[type] || []) as Data[];

        if (!relData.includes(rel)) {
          relData.push(rel);
          data[type] = relData;
          // Sort by id
          relData.sort((a, b) => {
            const idA = a[options.idKey] as string;
            const idB = b[options.idKey] as string;
            return idA < idB ? -1 : 1;
          });
        }
      }
    }
  };
}
