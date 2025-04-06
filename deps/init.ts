// const res = await fetch(
//   `https://cdn.deno.land/lume_init/meta/versions.json`,
// );
// const versions = await res.json();
// const { run } = await import(
//   `https://deno.land/x/lume_init@${versions.latest}/mod.ts`
// );
// const { default: upgrade } = await import(
//   `https://deno.land/x/lume_init@${versions.latest}/upgrade.ts`
// );

const commit = "7c6eb142ad077a9e0ff08466b787fbe096891295";

const { run } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${commit}/mod.ts`
);
const { default: upgrade } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${commit}/upgrade.ts`
);

export { run, upgrade };
