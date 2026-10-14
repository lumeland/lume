import { describe, it, expect } from "vitest";
import { build, getSite } from "@lumeland/testing/site.ts";
import wellKnown from "../src/mod.ts";

describe("well-known plugin", async () => {
  it("should render the existing .well-known folder", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    expect(await build(site)).toMatchSnapshot();
  });
  it("should generate new files", async () => {
    const site = getSite({
      cwd: import.meta.resolve("./assets"),
    });

    site.use(
      wellKnown({
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
        matrix: {
          server: {
            "m.server": "https://example.com",
          },
        },
      }),
    );

    expect(await build(site)).toMatchSnapshot();
  });
});
