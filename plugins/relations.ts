import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Data, Page } from "../core/file.ts";

type RelationFilter = (data1: Data, data2: Data) => boolean;

interface ForeignKeyOptions {
  foreignKey: string;
  relationKey?: string;
  pluralRelationKey?: string;
  idKey?: string;
  filter?: RelationFilter;
}

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** The field name used to save the page id */
  idKey?: string;

  /** The field name used to save the page type */
  typeKey?: string;

  /** The foreign keys per type (type => foreign_key) */
  foreignKeys: Record<string, string | ForeignKeyOptions>;
}

// Default options
export const defaults = {
  extensions: [".html"],
  idKey: "id",
  typeKey: "type",
  foreignKeys: {},
} satisfies Options;

/**
 * A plugin to create relations between pages
 * @see https://lume.land/plugins/relations/
 */
export function relations(userOptions: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, processRelations);

    function processRelations(pages1: Page[], pages: Page[]) {
      pages1.forEach((page1) => {
        const data1 = page1.data;
        const [
          type1,
          foreignKey1,
          id1,
          relationType1,
          pluralRelationKey1,
          filter1,
        ] = getRelationInfo(data1);

        // Index the current page with the other pages
        pages.forEach(indexPage);

        // Index the current page with previously generated pages (if any)
        site.pages.forEach(indexPage);

        function indexPage(page2: Page) {
          if (page1 === page2) {
            return;
          }

          const data2 = page2.data;

          if (filter1 && !filter1(data1, page2.data)) {
            return;
          }

          const [
            type2,
            foreignKey2,
            id2,
            relationType2,
            pluralRelationKey2,
            filter2,
          ] = getRelationInfo(data2);

          if (filter2 && !filter2(data2, page1.data)) {
            return;
          }

          // Page2 has a foreign key to page1
          const directRelation = relate(
            data1,
            data2,
            foreignKey1,
            id1,
            type1,
            relationType1,
            pluralRelationKey1,
          );
          // If it was related, do the opposite relation
          if (directRelation && pluralRelationKey2) {
            saveMultipleRelation(
              data2,
              data1,
              pluralRelationKey2,
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
            relationType2,
            pluralRelationKey2,
          );

          // If it was related, do the opposite relation
          if (reverseRelation && pluralRelationKey1) {
            saveMultipleRelation(
              data1,
              data2,
              pluralRelationKey1,
            );
          }
        }

        function relate(
          rel: Data,
          data: Data,
          foreignKey?: string,
          id?: string | number,
          type?: string,
          relationKey?: string,
          pluralRelationKey?: string,
        ): boolean {
          if (foreignKey && type && id && data[foreignKey]) {
            const relId = data[foreignKey] as
              | string
              | number
              | (string | number)[];

            // The foreign key contain an array
            if (Array.isArray(relId)) {
              if (relId.includes(id)) {
                saveMultipleRelation(rel, data, pluralRelationKey || type);
                return true;
              }
              return false;
            }

            // The foreign key is a single value
            if (relId == id) {
              data[relationKey || type] = rel;
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
      });
    }
  };

  function getRelationInfo(
    data: Data,
  ): [string?, string?, (string | number)?, string?, string?, RelationFilter?] {
    const type = data[options.typeKey];
    if (typeof type !== "string") {
      return [];
    }

    const foreignKey = options.foreignKeys[type];
    if (!foreignKey) {
      return [type, undefined, undefined, type, type];
    }

    if (typeof foreignKey === "string") {
      const id = data[options.idKey];
      return [
        type,
        foreignKey,
        typeof id === "string" || typeof id === "number" ? id : undefined,
        type,
        type,
      ];
    }

    const id = data[foreignKey.idKey || options.idKey];
    return [
      type,
      foreignKey.foreignKey,
      typeof id === "string" || typeof id === "number" ? id : undefined,
      foreignKey.relationKey || type,
      foreignKey.pluralRelationKey || foreignKey.relationKey || type,
      foreignKey.filter,
    ];
  }
}

export default relations;
