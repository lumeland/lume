export { default as format } from "https://deno.land/x/date_fns@v2.22.1/format/index.js";
export { default as parseISO } from "https://deno.land/x/date_fns@v2.22.1/parseISO/index.js";
export const modulePath = "https://deno.land/x/date_fns@v2.22.1";

export async function loadLanguages(languages: string[]) {
  const loaded: Record<string, unknown> = {};

  await Promise.all(languages.map(async (language) => {
    const module = await import(`${modulePath}/locale/${language}/index.js`);
    loaded[language] = module.default;
  }));

  return loaded;
}
