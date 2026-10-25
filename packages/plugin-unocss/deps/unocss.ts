export {
  BetterMap,
  createGenerator,
  type UnocssPluginContext,
  type UnoGenerator,
  type UserConfig,
} from "@unocss/core";

export { loadConfig } from "@unocss/config";
export { presetWind3 } from "@unocss/preset-wind3";
export { default as transformerVariantGroup } from "@unocss/transformer-variant-group";
export { default as transformerDirectives } from "@unocss/transformer-directives";
export { default as MagicString } from "magic-string";

export type Reset = "tailwind" | "tailwind-compat" | "eric-meyer";

export function getResetCssFile(reset: Reset): string {
  return import.meta.resolve(`@unocss/reset/${reset}.css`);
}
