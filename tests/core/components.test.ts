import {
  assert,
  assertEquals,
  assertStrictEquals as equals,
} from "../../deps/assert.ts";
import { getPath } from "../utils.ts";
import Reader from "../../core/reader.ts";
import nunjucks from "../../deps/nunjucks.ts";
import { compile as pug } from "../../deps/pug.ts";
import * as eta from "../../deps/eta.ts";
import { Liquid } from "../../deps/liquid.ts";
import { NunjucksEngine } from "../../plugins/nunjucks.ts";
import { LiquidEngine } from "../../plugins/liquid.ts";
import { ModuleEngine } from "../../plugins/modules.ts";
import { EtaEngine } from "../../plugins/eta.ts";
import { PugEngine } from "../../plugins/pug.ts";
import { JsxEngine } from "../../plugins/jsx.ts";
import ComponentsLoader from "../../core/component_loader.ts";
import Components from "../../core/components.ts";
import textLoader from "../../core/loaders/text.ts";
import moduleLoader from "../../core/loaders/module.ts";

Deno.test("Components", async (t) => {
  const src = getPath("core/components_assets");

  const reader = new Reader({ src });
  const componentsLoader = new ComponentsLoader({ reader });

  equals(componentsLoader.loaders.entries.length, 0);

  // Set up nunjucks
  const fsLoader = new nunjucks.FileSystemLoader(src);
  const env = new nunjucks.Environment(fsLoader);
  componentsLoader.set([".njk"], textLoader, new NunjucksEngine(env, src));

  // Set up liquid
  componentsLoader.set(
    [".liquid"],
    textLoader,
    new LiquidEngine(new Liquid(), src),
  );

  // Set up modules
  componentsLoader.set([".ts"], moduleLoader, new ModuleEngine());

  // Set up eta
  eta.configure({ useWith: true });
  componentsLoader.set([".eta"], textLoader, new EtaEngine(eta, src));

  // Set up pug
  componentsLoader.set([".pug"], textLoader, new PugEngine(pug, src));

  // Set up jsx
  componentsLoader.set([".jsx"], moduleLoader, new JsxEngine());

  const componentsTree = (await componentsLoader.load("/"))!;
  const components = new Components({
    globalData: {},
    cssFile: "/components.css",
    jsFile: "/components.js",
  });

  const comps = components.toProxy(componentsTree);

  await t.step("Nunjucks components", () => {
    assert(componentsTree.has("button_njk"));
    assert(comps.button_njk);
    // @ts-ignore: TODO: fix
    const result = comps.button_njk({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_njk">Hello world</button>`,
    );
  });

  await t.step("Liquid components", () => {
    assert(componentsTree.has("button_liquid"));
    assert(comps.button_liquid);
    // @ts-ignore: TODO: fix
    const result = comps.button_liquid({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_liquid">Hello world</button>`,
    );
  });

  await t.step("Module components", () => {
    assert(componentsTree.has("button_ts"));
    assert(comps.button_ts);
    // @ts-ignore: TODO: fix
    const result = comps.button_ts({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_ts">Hello world</button>`,
    );
  });

  await t.step("Eta components", () => {
    assert(componentsTree.has("button_eta"));
    assert(comps.button_eta);
    // @ts-ignore: TODO: fix
    const result = comps.button_eta({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_eta">Hello world</button>`,
    );
  });

  await t.step("Pug components", () => {
    assert(componentsTree.has("button_pug"));
    assert(comps.button_pug);
    // @ts-ignore: TODO: fix
    const result = comps.button_pug({ text: "Hello world" });
    assertEquals(
      result.trim(),
      `<button class="button_pug">Hello world</button>`,
    );
  });

  await t.step("JSX components", () => {
    assert(componentsTree.has("button_jsx"));
    assert(comps.button_jsx);
    // @ts-ignore: TODO: fix
    const result = comps.button_jsx({ text: "Hello world" });
    assertEquals(
      result.toString().trim(),
      `<button class="button_jsx">Hello world</button>`,
    );
  });
});
