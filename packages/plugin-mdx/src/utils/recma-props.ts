export interface Options {
  names?: string[];
}

export function propsToRootScope(options: Options = {}) {
  const names = Array.isArray(options.names) ? options.names : [];

  return function transformer(tree: any): void {
    // Find: function _createMdxContent(props) { ... }
    for (const node of tree.body ?? []) {
      if (node.type === "FunctionDeclaration" && node.id && node.id.name === "_createMdxContent") {
        // Ensure first param exists and is named `props`
        if (!node.params.length) {
          node.params.push({
            type: "Identifier",
            name: "props",
          });
        } else if (node.params[0].type !== "Identifier") {
          // Unexpected param shape
          return;
        }

        const propsParamName = node.params[0].name;

        // Build:
        const properties = names.map((name) => ({
          type: "Property" as const,
          kind: "init" as const,
          method: false,
          shorthand: true,
          computed: false,
          key: { type: "Identifier" as const, name },
          value: { type: "Identifier" as const, name },
        }));

        const decl = {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: {
                type: "ObjectPattern",
                properties,
              },
              init: {
                type: "LogicalExpression",
                operator: "??",
                left: { type: "Identifier", name: propsParamName },
                right: { type: "ObjectExpression", properties: [] },
              },
            },
          ],
        };

        node.body.body.unshift(decl);
        return;
      }
    }
  };
}
