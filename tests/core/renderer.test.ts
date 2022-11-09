import { assert, assertStrictEquals as equals } from "../../deps/assert.ts";
import { getSite } from "../utils.ts";
import { getGitDate } from "../../core/page_preparer.ts";
import { Page } from "../../core/filesystem.ts";

Deno.test("Prepare page (Renderer)", async (t) => {
  const site = getSite({
    src: "simple",
  });
  const { pagePreparer } = site;

  await t.step("Calculate the date", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2020-01-01";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2020);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 0);
    equals(date.getMinutes(), 0);
    equals(date.getSeconds(), 0);
  });

  await t.step("Calculate the datetime", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01 03:10:10";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2021);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 3);
    equals(date.getMinutes(), 10);
    equals(date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01T03:10:10Z";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2021);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 3);
    equals(date.getMinutes(), 10);
    equals(date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes 2", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "2021-01-01T03:10:10-0700";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2021);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 10);
    equals(date.getMinutes(), 10);
    equals(date.getSeconds(), 10);
  });

  await t.step("Calculate ISO datestimes 3", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "20210101";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2021);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 0);
    equals(date.getMinutes(), 0);
    equals(date.getSeconds(), 0);
  });

  await t.step("Calculate ISO datestimes 4", () => {
    const page = new Page();
    // @ts-ignore testing
    page.data.date = "20210101T031010Z";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    equals(date.getFullYear(), 2021);
    equals(date.getMonth(), 0);
    equals(date.getDate(), 1);
    equals(date.getHours(), 3);
    equals(date.getMinutes(), 10);
    equals(date.getSeconds(), 10);
  });

  await t.step("Calculate git created", () => {
    const page = new Page({
      path: "page1",
      ext: ".md",
    });
    // @ts-ignore testing
    page.data.date = "git created";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    const gitDate = getGitDate(
      "created",
      site.src(page.src.path + page.src.ext),
    );
    assert(gitDate?.getTime() === date.getTime());
  });

  await t.step("Calculate git last modified", () => {
    const page = new Page({
      path: "page1",
      ext: ".md",
    });
    // @ts-ignore testing
    page.data.date = "git last modified";
    const date = pagePreparer.getDate(page);
    assert(date instanceof Date);
    const gitDate = getGitDate(
      "modified",
      site.src(page.src.path + page.src.ext),
    );
    assert(gitDate?.getTime() === date.getTime());
  });
});
