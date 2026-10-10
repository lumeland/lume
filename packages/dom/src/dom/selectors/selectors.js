import { DOM as NWAPI } from "./nwsapi-types.js";
import { DOM as Sizzle } from "./sizzle-types.js";
let codeGenerationAllowed = null;
export function getSelectorEngine() {
  if (codeGenerationAllowed === null) {
    try {
      new Function("");
      codeGenerationAllowed = true;
    } catch (e) {
      codeGenerationAllowed = false;
    }
  }
  if (codeGenerationAllowed) {
    return NWAPI;
  } else {
    return Sizzle;
  }
}
/**
 * Explicitly disable querySelector/All code generation with the `Function`
 * constructor forcing the Sizzle engine. Enables those APIs on platforms
 * like Deno Deploy that don't allow code generation.
 */ export function disableCodeGeneration() {
  codeGenerationAllowed = false;
}
//# sourceMappingURL=selectors.js.map