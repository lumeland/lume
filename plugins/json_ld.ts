import { isPlainObject, merge } from "../core/utils/object.ts";
import { getDataValue } from "../core/utils/data_values.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import { Graph, Thing } from "npm:schema-dts@1.1.2";
export interface Options {
  /** The list extensions this plugin applies to */
  extensions?: string[];

  /** The key name for the transformations definitions */
  name?: string;
}

const defaults: Options = {
  extensions: [".html"],
  name: "jsonLd",
};

export type JsonldData = Graph | Thing;

/**
 * This variable is the result of running
 * JSON.stringify(Array.from(document.querySelectorAll('th.prop-nam a')).map(a => a.textContent))
 * on https://schema.org/URL and add '@id'.
 */
const urlKeys = [
  "@id",
  "acceptsReservations",
  "acquireLicensePage",
  "actionPlatform",
  "actionableFeedbackPolicy",
  "additionalType",
  "afterMedia",
  "applicationCategory",
  "applicationSubCategory",
  "archivedAt",
  "artMedium",
  "artform",
  "artworkSurface",
  "asin",
  "associatedDisease",
  "bankAccountType",
  "beforeMedia",
  "benefitsSummaryUrl",
  "bodyType",
  "category",
  "childTaxon",
  "codeRepository",
  "colleague",
  "colorSwatch",
  "competencyRequired",
  "constraintProperty",
  "contentUrl",
  "correction",
  "correctionsPolicy",
  "courseMode",
  "credentialCategory",
  "discussionUrl",
  "diseasePreventionInfo",
  "diseaseSpreadStatistics",
  "diversityPolicy",
  "diversityStaffingReport",
  "documentation",
  "downloadUrl",
  "duringMedia",
  "editEIDR",
  "educationalCredentialAwarded",
  "educationalLevel",
  "educationalProgramMode",
  "embedUrl",
  "encodingFormat",
  "engineType",
  "ethicsPolicy",
  "featureList",
  "feesAndCommissionsSpecification",
  "fileFormat",
  "fuelType",
  "gameLocation",
  "gamePlatform",
  "genre",
  "gettingTestedInfo",
  "gtin",
  "hasGS1DigitalLink",
  "hasMap",
  "hasMenu",
  "hasMolecularFunction",
  "hasRepresentation",
  "healthPlanMarketingUrl",
  "identifier",
  "image",
  "inCodeSet",
  "inDefinedTermSet",
  "installUrl",
  "isBasedOn",
  "isBasedOnUrl",
  "isInvolvedInBiologicalProcess",
  "isLocatedInSubcellularLocation",
  "isPartOf",
  "keywords",
  "knowsAbout",
  "labelDetails",
  "layoutImage",
  "legislationIdentifier",
  "license",
  "loanType",
  "logo",
  "mainEntityOfPage",
  "map",
  "maps",
  "masthead",
  "material",
  "measurementMethod",
  "measurementTechnique",
  "meetsEmissionStandard",
  "memoryRequirements",
  "menu",
  "merchantReturnLink",
  "missionCoveragePrioritiesPolicy",
  "namedPosition",
  "newsUpdatesAndGuidelines",
  "noBylinesPolicy",
  "occupationalCredentialAwarded",
  "originalMediaLink",
  "ownershipFundingInfo",
  "parentTaxon",
  "paymentUrl",
  "physicalRequirement",
  "prescribingInfo",
  "productReturnLink",
  "propertyID",
  "publicTransportClosuresInfo",
  "publishingPrinciples",
  "quarantineGuidelines",
  "relatedLink",
  "releaseNotes",
  "replyToUrl",
  "requirements",
  "roleName",
  "sameAs",
  "schemaVersion",
  "schoolClosuresInfo",
  "screenshot",
  "sdLicense",
  "season",
  "securityClearanceRequirement",
  "sensoryRequirement",
  "serviceUrl",
  "shippingSettingsLink",
  "significantLink",
  "significantLinks",
  "softwareRequirements",
  "speakable",
  "sport",
  "statType",
  "storageRequirements",
  "surface",
  "target",
  "targetUrl",
  "taxonRank",
  "taxonomicRange",
  "temporalCoverage",
  "termsOfService",
  "thumbnailUrl",
  "ticketToken",
  "titleEIDR",
  "tourBookingPage",
  "trackingUrl",
  "travelBans",
  "unitCode",
  "unnamedSourcesPolicy",
  "url",
  "usageInfo",
  "usesHealthPlanIdStandard",
  "vehicleTransmission",
  "verificationFactCheckingPolicy",
  "warning",
  "webFeed",
];

function isEmpty(v: unknown) {
  return v === undefined || v === null || v === "";
}

/**
 * A plugin to insert structured JSON-LD data for SEO and social media
 * @see https://lume.land/plugins/json_ld/
 */
export function jsonLd(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.mergeKey(options.name, "object");
    site.process(options.extensions, (pages) => pages.forEach(jsonLdProcessor));

    function jsonLdProcessor(page: Page) {
      let jsonLdData = page.data[options.name] as JsonldData | undefined;

      if (!jsonLdData || !page.document) {
        return;
      }
      const { document, data } = page;

      // Recursive function to traverse and process JSON-LD data
      function traverse(key: string | undefined, value: unknown): unknown {
        if (typeof value === "string") {
          const dataValue = getDataValue(data, value);
          // Check if the value is a URL or ID that needs to be processed
          if (
            key &&
            urlKeys.includes(key) &&
            (dataValue.startsWith("/") ||
              dataValue.startsWith("./") ||
              dataValue.startsWith("../"))
          ) {
            const pageUrl = site.url(data.url, true);
            return new URL(dataValue, pageUrl);
          }
          return isEmpty(dataValue) ? undefined : dataValue;
        }
        if (Array.isArray(value)) {
          return value.reduce((p, c) => {
            const processedValue = traverse(key, c);
            if (!isEmpty(value)) p.push(processedValue);
            return p;
          }, []);
        }
        if (isPlainObject(value)) {
          const processedObject: Record<string, unknown> = {};
          let isEmptyObject = true;
          for (const [key, v] of Object.entries(value)) {
            const processedValue = traverse(key, v);
            // If there's no valid value other than @type, remove this object
            if (!(key === "@type") && processedValue) isEmptyObject = false;
            processedObject[key] = processedValue;
          }
          return isEmptyObject ? undefined : processedObject;
        }
        return value;
      }

      jsonLdData = traverse(undefined, jsonLdData) as Graph;

      if (jsonLdData || Object.keys(jsonLdData ?? {}).length !== 0) {
        if (jsonLdData["@context"] === undefined) {
          jsonLdData["@context"] = "https://schema.org";
        }
        const script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.textContent = JSON.stringify(jsonLdData);
        document.head.appendChild(script);
        document.head.appendChild(document.createTextNode("\n"));
      }
    }
  };
}

export default jsonLd;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * JSON_LD elements
       * @see https://lume.land/plugins/json_ld/
       */
      jsonLd?: JsonldData;
    }
  }
}
