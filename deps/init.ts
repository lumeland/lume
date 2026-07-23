const version = "0.17.1";
const { run } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${version}/mod.ts`
);
const { default: upgrade } = await import(
  `https://cdn.jsdelivr.net/gh/lumeland/init@${version}/upgrade.ts`
);

export { run, upgrade };
