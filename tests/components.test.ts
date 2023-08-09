import { assert, assertEquals } from "../deps/assert.ts";
import { build, getSite } from "./utils.ts";

import liquid from "../plugins/liquid.ts";
import eta from "../plugins/eta.ts";
import pug from "../plugins/pug.ts";
import jsx from "../plugins/jsx.ts";
import vento from "../plugins/vento.ts";

Deno.test("Components", async (t) => {
  const site = getSite({
    src: "components",
  });

  site.use(liquid());
  site.use(eta());
  site.use(pug());
  site.use(jsx());
  site.use(vento());

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

  const comp = site.pages.find((page) => page.data.url === "/")?.data.comp;
  const subcomp =
    site.pages.find((page) => page.data.url === "/subfolder/")?.data.comp;

  await t.step("Components are accessed from comp", () => {
    assert(comp);
    assert(comp.button_eta);
    assert(comp.button_jsx);
    assert(comp.button_njk);
    assert(comp.button_liquid);
    assert(comp.button_vto);

    assert(subcomp);
    assert(subcomp.button_eta);
    assert(subcomp.button_jsx);
    assert(subcomp.button_njk);
    assert(subcomp.button_liquid);
    assert(subcomp.innerbutton);
    assert(subcomp.button_pug);
    assert(subcomp.button_ts);
  });

  await t.step("Nunjucks components", () => {
    const result = comp.button_njk({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_njk">Hello world</button>`,
    );
  });

  await t.step("Vento components", () => {
    const result = comp.button_vto({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_vto">Hello world</button>`,
    );
  });

  await t.step("Inherit and not inherit data for components", () => {
    assertEquals(
      comp.inherit().trim(),
      `<p>Inherit: Hello from _data.yml</p>`,
    );
    assertEquals(
      comp.not_inherit().trim(),
      `<p>Not inherit: </p>`,
    );
  });

  await t.step("Liquid components", () => {
    const result = comp.button_liquid({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_liquid">Hello world</button>`,
    );
  });

  await t.step("Module components", () => {
    const result = subcomp.button_ts({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_ts">Hello world</button>`,
    );
  });

  await t.step("Eta components", () => {
    const result = comp.button_eta({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_eta">Hello world</button>`,
    );
  });

  await t.step("Pug components", () => {
    const result = subcomp.button_pug({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_pug">Hello world</button>`,
    );
  });

  await t.step("JSX components", () => {
    const result = comp.button_jsx({ text: "Hello world" });
    assertEquals(
      result.toString().trim(),
      `<button class="button_jsx">Hello world</button>`,
    );
  });

  await t.step("JS inner components", () => {
    const result = subcomp.innerButton({ text: "Inner button" });
    assertEquals(
      result.toString().trim(),
      `<div><button class="button_jsx">Inner button</button></div>`,
    );
  });

  await t.step("Custom components", () => {
    assertEquals(
      comp.custom.button({ text: "Hello world" }),
      `<button class="custom">Hello world</button>`,
    );
    assertEquals(
      comp.custom.header.title({ text: "Hello world" }),
      `<h1 class="custom">Hello world</h1>`,
    );
  });
});
