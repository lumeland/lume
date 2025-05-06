import { pluginNames } from "./core/utils/lume_config.ts";

// For these plugins no matter the order
const orderNoMatter = new Set([
  "attributes",
  "date",
  "decap_cms",
  "fff",
  "eta",
  "extract_date",
  "jsx",
  "reading_info",
  "relations",
  "mdx",
  "nav",
  "nunjucks",
  "pagefind",
  "plaintext",
  "pug",
  "remark",
  "robots",
  "sheets",
  "filter_pages",
  "redirects",
  "icons",
]);

const validOrder = pluginNames
  .filter((name) => !orderNoMatter.has(name))
  .map((name) => `lume/plugins/${name}.ts`);

export default {
  name: "lume",
  rules: {
    "plugin-order": {
      create(context) {
        const { filename } = context;
        const files = ["_config.ts", "_config.js", "plugins.ts", "plugins.js"];

        // Ignore files that are not lume config files
        if (files.every((file) => !filename.endsWith(file))) {
          return {};
        }

        const imports = new Map<string, number>();
        const calls: string[] = [];

        return {
          "ImportDeclaration[source.value=/lume\/plugins\//]"(node) {
            const source = node.source.value;
            const identifier = node.specifiers[0].local.name;
            const position = validOrder.indexOf(source);

            if (position !== -1) {
              imports.set(identifier, position);
            }
          },
          CallExpression(node) {
            const name = "name" in node.callee ? node.callee.name : undefined;
            if (!name) {
              return;
            }
            const position = imports.get(name);
            if (position === undefined) {
              return;
            }

            let validPrevious: [string, number] | undefined;

            for (const callName of calls) {
              const callPosition = imports.get(callName)!;

              if (position < callPosition) {
                if (!validPrevious || callPosition < validPrevious[1]) {
                  validPrevious = [callName, callPosition];
                }
              }
            }

            if (validPrevious) {
              context.report({
                node,
                message:
                  `Invalid order of plugins: "${name}" should be used before "${
                    validPrevious[0]
                  }"`,
              });
            }

            calls.push(name);
          },
        };
      },
    },
    "jsx-spread-position": {
      create(context) {
        return {
          "JSXSpreadAttribute:not(:last-child)"(node) {
            context.report({
              node,
              message:
                "JSX spread attributes should be at the end of the props",
            });
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
