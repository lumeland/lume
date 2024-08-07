import { createSite } from "./utils.ts";

/** Run one or more custom scripts */
export async function run(
  config: string | undefined,
  scripts: string[],
) {
  const site = await createSite(config);

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}
