import { assert, assertEquals } from "../deps/assert.ts";
import { assertSiteSnapshot, build, getSite } from "./utils.ts";

import eta from "../plugins/eta.ts";
import pug from "../plugins/pug.ts";
import jsx from "../plugins/jsx.ts";
import nunjucks from "../plugins/nunjucks.ts";

Deno.test("Components", async (t) => {
  const site = getSite({
    src: "components",
  });

  site.use(eta());
  site.use(pug());
  site.use(jsx());
  site.use(nunjucks());

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

  assert(site.scopedComponents.get("/")?.get("custom"));

  await build(site);

  const comp = site.pages.find((page) => page.data.url === "/")?.data.comp!;
  const subcomp = site.pages.find((page) => page.data.url === "/subfolder/")
    ?.data.comp!;

  await t.step("Components are accessed from comp", () => {
    assert(comp);
    assert(comp.eta_button);
    assert(comp.jsx_button);
    assert(comp.njk_button);
    assert(comp.vento_button);

    assert(subcomp);
    assert(subcomp.eta_button);
    assert(subcomp.jsx_button);
    assert(subcomp.njk_button);
    assert(subcomp.innerbutton);
    assert(subcomp.pug_button);
    assert(subcomp.ts_button);
  });

  await t.step("Folder components are loaded", () => {
    assert(comp);
    assert(comp.header);
  });

  await t.step("Nunjucks components", async () => {
    const result = await comp.njk_button({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_njk">Hello world</button>`,
    );
  });

  await t.step("Nunjucks components with custom attributes", async () => {
    const result = await comp.njk_button({
      text: "Hello world",
      className: "custom",
    });
    assertEquals(
      result.trim(),
      `<button class="custom">Hello world</button>`,
    );
  });

  await t.step("Vento components", async () => {
    const result = await comp.vento_button({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_vto">Hello world</button>`,
    );
  });

  await t.step("Inherit and not inherit data for components", async () => {
    assertEquals(
      (await comp.inherit()).trim(),
      `<p>Inherit: Hello from _data.yml</p>`,
    );
    assertEquals(
      (await comp.not_inherit()).trim(),
      `<p>Not inherit: </p>`,
    );
  });

  await t.step("Module components", async () => {
    const result = await subcomp.ts_button({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_ts">Hello world</button>`,
    );
  });

  await t.step("Eta components", async () => {
    const result = await comp.eta_button({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_eta">Hello world</button>`,
    );
  });

  await t.step("Pug components", async () => {
    const result = await subcomp.pug_button({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_pug">Hello world</button>`,
    );
  });

  await t.step("JSX components", async () => {
    const result = await comp.jsx_button({ text: "Hello world" });

    assertEquals(
      result.toString().trim(),
      `<button type="button" class="button_jsx">Hello world</button>`,
    );
  });

  await t.step("JSX components with custom attributes", async () => {
    const result = await comp.jsx_button({
      text: "Hello world",
      className: "custom",
    });

    assertEquals(
      result.toString().trim(),
      `<button type="button" class="custom">Hello world</button>`,
    );
  });

  await t.step("JS inner components", async () => {
    const result = await subcomp.innerButton({ text: "Inner button" });

    assertEquals(
      result.toString().trim(),
      `<div><button type="button" class="button_jsx">Inner button</button></div>`,
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

Deno.test("Folder components", async (t) => {
  const site = getSite({
    src: "components",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});
