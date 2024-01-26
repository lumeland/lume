let temp = globalThis.Temporal;

// Load the polyfill if needed
if (typeof temp === "undefined") {
  const mod = await import("npm:@js-temporal/polyfill@0.4.4");
  // @ts-ignore: Types don't match
  temp = mod.Temporal;
}

export { temp as Temporal };
