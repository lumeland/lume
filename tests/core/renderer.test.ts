import { assert, assertStrictEquals as equals } from "../../deps/assert.ts";
import { getSite } from "../utils.ts";
import { Page } from "../../core/filesystem.ts";

Deno.test("Prepare page (Renderer)", async (t) => {
  const site = getSite({
    src: "simple",
  });
  const { renderer } = site;

  await t.step("Calculate the date", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2020-01-01";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2020);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 0);
    equals(page.data.date.getMinutes(), 0);
    equals(page.data.date.getSeconds(), 0);
  });

  await t.step("Calculate the datetime", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01 03:10:10";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2021);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 3);
    equals(page.data.date.getMinutes(), 10);
    equals(page.data.date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01T03:10:10Z";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2021);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 3);
    equals(page.data.date.getMinutes(), 10);
    equals(page.data.date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes 2", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01T03:10:10-0700";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2021);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 10);
    equals(page.data.date.getMinutes(), 10);
    equals(page.data.date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes 3", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "20210101";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2021);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 0);
    equals(page.data.date.getMinutes(), 0);
    equals(page.data.date.getSeconds(), 0);
  });

  await t.step("Calculate ISO datestimes 4", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "20210101T031010Z";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    equals(page.data.date.getFullYear(), 2021);
    equals(page.data.date.getMonth(), 0);
    equals(page.data.date.getDate(), 1);
    equals(page.data.date.getHours(), 3);
    equals(page.data.date.getMinutes(), 10);
    equals(page.data.date.getSeconds(), 10);
  });

  await t.step("Calculate git created", () => {
    const page = new Page({
      path: "page1",
      ext: ".md",
    });
    // @ts-ignore testing
    page.data.date = "git created";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    console.log(page.data);
    // equals(page.data.date.getFullYear(), 2021);
    // equals(page.data.date.getMonth(), 8);
    // equals(page.data.date.getDate(), 12);
    // equals(page.data.date.getHours(), 15);
    // equals(page.data.date.getMinutes(), 58);
    // equals(page.data.date.getSeconds(), 11);
  });

  await t.step("Calculate git last modified", () => {
    const page = new Page({
      path: "page1",
      ext: ".md",
    });
    // @ts-ignore testing
    page.data.date = "git last modified";
    renderer.preparePage(page);
    assert(page.data.date instanceof Date);
    console.log(page.data);
    // equals(page.data.date.getFullYear(), 2021);
    // equals(page.data.date.getMonth(), 8);
    // equals(page.data.date.getDate(), 12);
    // equals(page.data.date.getHours(), 15);
    // equals(page.data.date.getMinutes(), 58);
    // equals(page.data.date.getSeconds(), 11);
  });
});
