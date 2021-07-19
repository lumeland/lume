import { createSite } from "./utils.ts";

interface Options {
  root: string;
  config?: string;
}

/** Run one or more custom scripts */
export default async function run(
  { root, config }: Options,
  scripts: string[],
) {
  const site = await createSite(root, config);
  console.log();

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      window.addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}
