import { pluginNames } from "./core/utils/lume_config.ts";

const validOrder = pluginNames.map((name) => `lume/plugins/${name}.ts`);

export default {
  name: "lume",
  rules: {
    "plugin-order": {
      create(context) {
        const { filename } = context;

        // Ignore files that are not lume config files
        if (
          !filename.endsWith("_config.ts") && !filename.endsWith("_config.js")
        ) {
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
