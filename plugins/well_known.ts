import type Site from "../core/site.ts";

export interface Options {
  /**
   * The AT Protocol ID to validate the domain as a handler
   * @see https://atproto.com/specs/handle#https-well-known-method
   */
  atProto?: string;

  /**
   * To define security policies
   * @see https://securitytxt.org/
   */
  security?: Security;

  /**
   * To define the connections betweens website publishers and associations
   * @see https://journallist.net/reference-document-for-trust-txt-specifications
   */
  trust?: Trust;

  /**
   * WebFinger endpoint, following RFC 7033.
   * Note: since this generates a static file, it only supports a single fixed subject,
   * not dynamic `?resource=` lookups.
   * @see https://www.rfc-editor.org/rfc/rfc7033
   * @see https://datatracker.ietf.org/doc/html/rfc7033
   * @see https://webfinger.net/
   */
  webfinger?: WebFinger;

  /**
   * Indicates whether this site respect the Global Privacy Control signal
   * @see https://w3c.github.io/gpc/
   */
  gpc?: Gpc;

  /**
   * Migrate PWA from old domains
   * @see https://developer.chrome.com/blog/seamless-pwa-origin-migration
   */
  migratePWA?: string | string[];
}

interface Security {
  /**
   * Urls, phone number or email address to contact about security issues
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.3
   */
  contact: string | string[];

  /**
   * The date and time when the content of the security.txt file should be considered stale
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.5
   */
  expires: Date | Temporal.PlainDateTime;

  /**
   * A link to a key which security researchers should use to securely talk to you.
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.4
   */
  encryption?: string | string[];

  /**
   * Languages that your security team speaks. You may include more than one language
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.8
   */
  preferredLanguages?: string | string[];

  /**
   * Links to web pages where you say thank you to security researchers who have helped you.
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.1
   */
  acknowledgments?: string | string[];

  /**
   * Links to policy detailing what security researchers should do when searching for or reporting security issues
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.7
   */
  policy?: string | string[];

  /**
   * One or more links to any security-related job openings in your organisation
   * @see https://www.rfc-editor.org/info/rfc9116/#section-2.5.6
   */
  hiring?: string | string[];

  /**
   * Links to the provider-metadata.json of your CSAF (Common Security Advisory Framework) provider.
   * @see https://docs.oasis-open.org/csaf/csaf/v2.0/os/csaf-v2.0-os.html#718-requirement-8-securitytxt
   */
  csaf?: string | string[];
}

interface Trust {
  /** URLs for members of any Association. */
  member?: string | string[];

  /** Associations or other organizations that a Publisher may belong to. */
  belongTo?: string | string[];

  /** A domain directly controlled by one entity. For use by ownership groups or other similar organizational units. */
  control?: string | string[];

  /** Domain of owner or other controlling entity.  */
  controlledBy?: string;

  /** Any social media account directly controlled by the Publisher. */
  social?: string | string[];

  /** URIs for a Vendor to any Association or Publisher. */
  vendor?: string | string[];

  /** Included here will be the URI for a Customer to any Vendor. */
  customer?: string | string[];

  /** If a Publisher has, for example, an ethics policy, it can publish the URI for that. */
  disclosure?: string | string[];

  /**
   * Contact information that can be in any form, including physical or email addresses, a URI, etc.
   * As part of full transparency, Publishers or Associations may want to associate contact data
   * so that people who are part of Data Consumer organizations can make contact with questions.
   */
  contact?: string | string[];

  /**
   * Configure any scraper from an AI, a large language model, or any other tool designed to collect data from the
   * site of the publisher to be used in forms other than referring users to the site of origin
   */
  dataTrainingAllowed?: boolean;
}

interface WebFinger {
  /** The URI that identifies the entity, e.g. "acct:user@example.com" */
  subject: string;

  /** Alternative URIs for the subject */
  aliases?: string | string[];

  /** Additional properties as URI/value pairs */
  properties?: Record<string, string | null>;

  /** Relations to other resources, e.g. OIDC issuer, avatar, profile */
  links: WebFingerLink[];
}

interface WebFingerLink {
  /** Either a URI or a registered relation type */
  rel: string;

  /** The media type of the target resource */
  type?: string;

  /** URI pointing to the target resource. */
  href?: string;

  /** Name/value pairs whose names are a language tag or the string "und" */
  titles?: Record<string, string>;

  /** Name/value pairs whose names are URIs (referred to as "property identifiers") */
  properties?: Record<string, string | null>;
}

interface Gpc {
  /** True to indicate that the server intends to abide by GPC requests, or false, to indicate that it does not. */
  gpc: boolean;

  /** This indicates the time at which the statement of support was made */
  lastUpdate: Date | Temporal.PlainDate | Temporal.PlainDateTime;
}

export function wellKnown(options: Options) {
  return (site: Site) => {
    if (options.atProto) {
      site.page({
        url: "/.well-known/atproto-did",
        content: options.atProto,
      });
    }

    if (options.security) {
      site.page({
        url: "/.well-known/security.txt",
        content: buildSecurity(
          options.security,
          site.url("/.well-known/security.txt", true),
        ),
      });
    }

    if (options.trust) {
      site.page({
        url: "/.well-known/trust.txt",
        content: buildTrust(options.trust),
      });
    }

    if (options.webfinger) {
      site.page({
        url: "/.well-known/webfinger",
        content: JSON.stringify(buildWebFinger(options.webfinger), null, 2),
      });
    }

    if (options.gpc) {
      site.page({
        url: "/.well-known/gpc.json",
        content: JSON.stringify(
          {
            gpc: options.gpc.gpc,
            lastUpdate: toTemporal(options.gpc.lastUpdate),
          },
          null,
          2,
        ),
      });
    }

    if (options.migratePWA) {
      const entries = toArray(options.migratePWA).map((
        domain,
      ) => [domain, { allow_migration: true }]);
      site.page({
        url: "/.well-known/web-app-origin-association",
        content: JSON.stringify(Object.fromEntries(entries), null, 2),
      });
    }
  };
}

function buildSecurity(info: Security, canonical: string): string {
  const names = [
    "Contact",
    "Policy",
    "Encryption",
    "Acknowledgments",
    "Hiring",
    "CSAF",
  ];

  const lines: string[] = [];

  for (const name of names) {
    for (
      const value of toArray(
        info[name.toLowerCase() as keyof Security] as string | string[],
      )
    ) {
      lines.push(`${name}: ${value}`);
    }
  }

  lines.push(`Expires: ${toTemporal(info.expires)}`);

  if (info.preferredLanguages) {
    lines.push(
      `Preferred-Languages: ${toArray(info.preferredLanguages).join(", ")}`,
    );
  }

  lines.push(`Canonical: ${canonical}`);

  return lines.join("\n");
}

function buildTrust(info: Trust): string {
  const keys = [
    "member",
    "belongTo",
    "control",
    "social",
    "vendor",
    "customer",
    "disclosure",
    "contact",
    "dataTrainingAllowed",
  ];

  const lines: string[] = [];

  for (const key of keys) {
    for (
      const value of toArray(info[key as keyof Trust] as string | string[])
    ) {
      lines.push(`${key.toLowerCase()}=${value}`);
    }
  }

  if (info.controlledBy) {
    lines.push(`controlledby=${info.controlledBy}`);
  }

  if (typeof info.dataTrainingAllowed === "boolean") {
    lines.push(
      `datatrainingallowed=${info.dataTrainingAllowed ? "yes" : "no"}`,
    );
  }

  return lines.join("\n");
}

function buildWebFinger(info: WebFinger): Record<string, unknown> {
  const jrd: Record<string, unknown> = {
    subject: info.subject,
  };

  const aliases = toArray(info.aliases);
  if (aliases.length) {
    jrd.aliases = aliases;
  }

  if (info.properties) {
    jrd.properties = info.properties;
  }

  jrd.links = info.links;

  return jrd;
}

function toArray(v?: string | string[]): string[] {
  if (!v) {
    return [];
  }

  return Array.isArray(v) ? v : [v];
}

export default wellKnown;

function toTemporal(
  date: Date | Temporal.PlainDate | Temporal.PlainDateTime,
): Temporal.Instant | Temporal.PlainDate | Temporal.PlainDateTime {
  if (date instanceof Date) {
    return Temporal.Instant.from(date.toISOString());
  }

  return date;
}
