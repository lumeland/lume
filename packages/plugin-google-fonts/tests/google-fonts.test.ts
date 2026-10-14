import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import googleFonts from "../src/mod.ts";

describe("google-fonts plugin", async () => {
  it("should match site snapshot", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      googleFonts({
        fonts:
          "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should download and rename fonts", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      googleFonts({
        cssFile: "/styles/fonts.css",
        fonts: {
          "ui-font":
            "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
          "display-font": "https://fonts.google.com/share?selection.family=Londrina+Sketch",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });

  it("should use a placeholder", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      googleFonts({
        cssFile: "/styles.css",
        placeholder: "/* google-fonts */",
        subsets: ["latin", "[2]", "latin-ext"],
        ignoredSubsets: ["latin-ext"],

        fonts: {
          "ui-font":
            "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
          "display-font": "https://fonts.google.com/share?selection.family=Londrina+Sketch",
          "jp-font":
            "https://fonts.google.com/share?selection.family=Zen+Maru+Gothic:wght@700&display=optional",
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
