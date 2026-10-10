import { describe, it, expect } from "vitest";
import { createPaginator } from "../src/mod.ts";

describe("Pagination plugin", () => {
  it("Check results", () => {
    const paginator = createPaginator({
      size: 10,
      url: (num) => `/page/${num}`,
    });

    const all = Array(90)
      .fill(0)
      .map((_, i) => i + 1);

    const pages = paginator(all, {
      each(data) {
        data.title = `Page ${data.pagination.page}`;
      },
    });

    expect(pages.length).toBe(9);
    expect(pages[0].url).toBe("/page/1");
    expect(pages[0].title).toBe("Page 1");
    expect(pages[0].results.length).toBe(10);
    expect(pages[0].results[9]).toBe(10);
    expect(pages[0].pagination.page).toBe(1);
    expect(pages[0].pagination.totalPages).toBe(9);
    expect(pages[0].pagination.totalResults).toBe(90);
    expect(pages[0].pagination.previous).toBe(null);
    expect(pages[0].pagination.next).toBe("/page/2");
    expect(pages[0].pagination.first).toBe("/page/1");
    expect(pages[0].pagination.last).toBe("/page/9");
    expect(pages[4].pagination.previous).toBe("/page/4");
    expect(pages[4].pagination.next).toBe("/page/6");
    expect(pages[4].pagination.first).toBe("/page/1");
    expect(pages[4].pagination.last).toBe("/page/9");
    expect(pages[8].title).toBe("Page 9");
    expect(pages[8].pagination.previous).toBe("/page/8");
    expect(pages[8].pagination.next).toBe(null);
    expect(pages[8].pagination.first).toBe("/page/1");
    expect(pages[8].pagination.last).toBe("/page/9");
  });
});
