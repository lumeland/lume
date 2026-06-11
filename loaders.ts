import module from "node:module";

export function init(root: string) {
  module.registerHooks({
    resolve(specifier, context, nextResolve) {
      const { parentURL } = context;

      if (specifier.startsWith(root) || (specifier.startsWith(".") && parentURL?.startsWith(root))) {
        return nextResolve(`${specifier}#${Date.now()}`, { ...context })
      }
  
      return nextResolve(specifier);
    }
  });
}
