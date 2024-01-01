// https://github.com/denoland/deno/issues/19096
import transformerVariantGroupImport from "npm:@unocss/transformer-variant-group@0.58.2";
import transformerDirectivesImport from "npm:@unocss/transformer-directives@0.58.2";

export {
  createGenerator,
  type SourceCodeTransformer,
  type UnocssPluginContext,
  type UserConfig,
} from "npm:@unocss/core@0.58.2";
export { presetUno } from "npm:@unocss/preset-uno@0.58.2";
export { default as MagicString } from "npm:magic-string@0.30.5";

// https://github.com/denoland/deno/issues/16458#issuecomment-1295003089
export const transformerVariantGroup =
  transformerVariantGroupImport as unknown as typeof transformerDirectivesImport.default;
export const transformerDirectives =
  transformerDirectivesImport as unknown as typeof transformerDirectivesImport.default;

export const resetUrl = "https://unpkg.com/@unocss/reset@0.58.2";
