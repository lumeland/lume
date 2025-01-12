import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import googleFonts from "../plugins/google_fonts.ts";

Deno.test("Download a font from Google fonts", async (t) => {
  const site = getSite({
    src: "empty",
  });

  site.use(googleFonts({
    fonts:
      "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Download and rename fonts from Google fonts", async (t) => {
  const site = getSite({
    src: "empty",
  });

  site.use(googleFonts({
    cssFile: "/styles/fonts.css",
    fonts: {
      "ui-font":
        "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
      "display-font":
        "https://fonts.google.com/share?selection.family=Londrina+Sketch",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("Use a placeholder", async (t) => {
  const site = getSite({
    src: "google-fonts",
  });

  site.use(googleFonts({
    cssFile: "/styles.css",
    placeholder: "/* google-fonts */",
    subsets: ["latin", "[2]"],
    fonts: {
      "ui-font":
        "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900",
      "display-font":
        "https://fonts.google.com/share?selection.family=Londrina+Sketch",
      "jp-font":
        "https://fonts.google.com/share?selection.family=Zen+Maru+Gothic:wght@700&display=swap",
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
