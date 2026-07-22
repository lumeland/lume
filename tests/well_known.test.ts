import { assertSiteSnapshot, build, getSite } from "./utils.ts";
import wellKnown from "../plugins/well_known.ts";

Deno.test(".well-known folder", async (t) => {
  const site = getSite({
    src: "well_known",
  });

  await build(site);
  await assertSiteSnapshot(t, site);
});

Deno.test("well_known plugin", async (t) => {
  const site = getSite({
    src: "well_known",
  });

  site.use(wellKnown({
    atProto: "1234",
    security: {
      contact: "mailto:security@example.com",
      expires: new Date("2026-07-12T09:51:58.383Z"),
      preferredLanguages: ["en", "gl"],
      policy: "https://example.com/security-policy.txt",
    },
    gpc: {
      gpc: true,
      lastUpdate: Temporal.PlainDate.from("2020-10-10"),
    },
    trust: {
      contact: "mailto:info@example.com",
      social: "https://mastodon.gal/@misteroom",
      dataTrainingAllowed: false,
    },
    migratePWA: "https://old-domain.com/pwa",
    webfinger: {
      subject: "acct:user@example.com",
      links: [
        {
          rel: "http://openid.net/specs/connect/1.0/issuer",
          href: "https://codeberg.org",
        },
      ],
    },
  }));

  await build(site);
  await assertSiteSnapshot(t, site);
});
