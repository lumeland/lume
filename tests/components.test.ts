import { assert, assertEquals } from "../deps/assert.ts";
import { build, getSite } from "./utils.ts";

import liquid from "../plugins/liquid.ts";
import eta from "../plugins/eta.ts";
import pug from "../plugins/pug.ts";
import jsx from "../plugins/jsx.ts";

Deno.test("Components", async (t) => {
  const site = getSite({
    src: "components",
  });

  site.use(liquid());
  site.use(eta());
  site.use(pug());
  site.use(jsx());

  site.component("custom", {
    name: "button",
    render: ({ text }): string => {
      return `<button class="custom">${text}</button>`;
    },
  });

  site.component("custom.header", {
    name: "title",
    render: ({ text }): string => {
      return `<h1 class="custom">${text}</h1>`;
    },
  });

  assert(site.globalComponents.get("custom"));

  await build(site);

  await t.step("Components are accessed from comp", () => {
    const data = site.source.root?.data;
    assert(data);
    assert(data.comp);
    assert(data.comp.button_eta);
    assert(data.comp.button_jsx);
    assert(data.comp.button_njk);
    assert(data.comp.button_liquid);

    const subData = site.source.root?.dirs.get("subfolder")?.data;
    assert(subData);
    assert(subData.comp);
    assert(subData.comp.button_eta);
    assert(subData.comp.button_jsx);
    assert(subData.comp.button_njk);
    assert(subData.comp.button_liquid);
    assert(subData.comp.innerbutton);
    assert(subData.comp.button_pug);
    assert(subData.comp.button_ts);
  });

  await t.step("Nunjucks components", () => {
    const comp = site.source.root?.data.comp?.button_njk;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_njk">Hello world</button>`,
    );
  });

  await t.step("Liquid components", () => {
    const comp = site.source.root?.data.comp?.button_liquid;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_liquid">Hello world</button>`,
    );
  });

  await t.step("Module components", () => {
    const comp = site.source.root?.dirs.get("subfolder")?.data.comp?.button_ts;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_ts">Hello world</button>`,
    );
  });

  await t.step("Eta components", () => {
    const comp = site.source.root?.data.comp?.button_eta;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_eta">Hello world</button>`,
    );
  });

  await t.step("Pug components", () => {
    const comp = site.source.root?.dirs.get("subfolder")?.data.comp?.button_pug;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_pug">Hello world</button>`,
    );
  });

  await t.step("JSX components", () => {
    const comp = site.source.root?.data.comp?.button_jsx;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Hello world" });
    assertEquals(
      result.toString().trim(),
      `<button class="button_jsx">Hello world</button>`,
    );
  });

  await t.step("JS inner components", () => {
    const comp = site.source.root?.dirs.get("subfolder")?.data.comp
      ?.innerButton;

    // @ts-ignore: TODO: fix
    const result = comp({ text: "Inner button" });
    assertEquals(
      result.toString().trim(),
      `<div><button class="button_jsx">Inner button</button></div>`,
    );
  });

  await t.step("Custom components", () => {
    // @ts-ignore: Button component must exist
    const button = site.source.root?.data.comp?.custom.button;
    // @ts-ignore: Title component must exist
    const title = site.source.root?.data.comp?.custom.header.title;

    assertEquals(
      button({ text: "Hello world" }),
      `<button class="custom">Hello world</button>`,
    );
    assertEquals(
      title({ text: "Hello world" }),
      `<h1 class="custom">Hello world</h1>`,
    );
  });
});
