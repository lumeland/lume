export type ErrorMessage = string | {
  msg: string;
  text?: string;
  items?: string[];
  [key: string]: unknown;
};

export interface Options {
  /** Common words to check against */
  commonWords?: Set<string>;

  /** Rules for title validation */
  title?: Rules | false;

  /** Rules for H1 validation */
  h1?: Rules | false;

  /** Validate that headings are in a proper order */
  headingsOrder?: boolean;

  /** Check that page titles are not duplicated */
  duplicateTitles?: boolean;

  /** Check that page descriptions are not duplicated */
  duplicateDescription?: boolean;

  /** Rules for description validation */
  description?: Rules | false;

  /** Rules for URL validation */
  url?: Rules | false;

  /** Rules for image alt text validation */
  imgAlt?: Rules | false;

  /** Rules for image title text validation */
  imgTitle?: Rules | false;

  /** Rules for body content validation */
  body?: Rules | false;
}

/**
 * Defines the units that can be used for length/count requirements.
 * - `character`: Raw character count.
 * - `grapheme`: User-perceived characters (e.g., "👍🏽" is one grapheme).
 * - `word`: Words, segmented by locale.
 * - `sentence`: Sentences, segmented by locale.
 */
export type LengthUnit =
  | "character"
  | "grapheme"
  | "word"
  | "sentence";

type CommonWords = Set<string>;
export interface Rules {
  min?: number;
  unit: LengthUnit;
  max?: number;
  maxCommonWords?: number;
}

const titles = new Map<string, string[]>(); // title -> url[]
const descriptions = new Map<string, string[]>(); // description -> url[]

export function refresh() {
  titles.clear();
  descriptions.clear();
}

export function validatePage(
  document: Document,
  pageUrl: string,
  lang: string = "en",
  options: Options = {},
): ErrorMessage[] {
  const results: ErrorMessage[] = [];
  const commonWords = options.commonWords;

  if (options.h1) {
    results.push(...headingH1(document, lang, options.h1, commonWords));
  }

  if (options.headingsOrder) {
    results.push(...headingOrder(document));
  }

  if (options.imgAlt) {
    results.push(...imgAlt(document, lang, options.imgAlt, commonWords));
  }

  if (options.imgTitle) {
    results.push(...imgTitle(document, lang, options.imgTitle, commonWords));
  }

  if (options.title) {
    results.push(...title(document, lang, options.title, commonWords));
  }

  if (options.duplicateTitles) {
    results.push(...duplicateTitles(document, pageUrl));
  }

  if (options.duplicateDescription) {
    results.push(...duplicateDescription(document, pageUrl));
  }

  if (options.description) {
    results.push(
      ...description(document, lang, options.description, commonWords),
    );
  }

  if (options.url) {
    results.push(...url(pageUrl, lang, options.url, commonWords));
  }

  if (options.body) {
    results.push(...body(document, lang, options.body, commonWords));
  }

  return results;
}

function headingH1(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const headingOneElements = document.querySelectorAll("h1");
  if (headingOneElements.length === 0) {
    return ["MISSING_H1"];
  }

  if (headingOneElements.length > 1) {
    return ["MULTIPLE_H1"];
  }

  const text = headingOneElements[0].textContent || "";
  const error = checkConformity(
    text,
    lang,
    rules,
    commonWords,
  );

  switch (error?.error) {
    case "TOO_SHORT":
      return [{
        msg: "H1_TOO_SHORT",
        count: error.count,
        min: rules.min,
        unit: rules.unit,
        text,
      }];

    case "TOO_LONG":
      return [{
        msg: "H1_TOO_LONG",
        count: error.count,
        max: rules.max,
        unit: rules.unit,
        text,
      }];

    case "TOO_COMMON_WORDS":
      return [{
        msg: "H1_COMMON_WORDS",
        percentage: error.count,
        maxCommonWords: rules.maxCommonWords,
        text,
      }];
  }
  return [];
}

function headingOrder(document: Document): ErrorMessage[] {
  const results: ErrorMessage[] = [];
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let previousLevel = 0; // Start with 0, assuming H1 is level 1
  for (const heading of headings) {
    const currentLevel = parseInt(heading.tagName.slice(1));
    if (currentLevel > previousLevel + 1) {
      results.push({
        msg: "HEADING_ORDER",
        heading: heading.tagName,
        text: heading.textContent ?? undefined,
      });
    }
    previousLevel = currentLevel;
  }
  return results;
}

function duplicateTitles(document: Document, pageUrl: string): ErrorMessage[] {
  const rawTitle = document.title;

  if (rawTitle) {
    const key = rawTitle?.toLowerCase().trim() || "";
    const items = titles.get(key);
    if (items) {
      items.push(pageUrl);
      return [{
        msg: "DUPLICATE_TITLE",
        text: rawTitle,
        items,
      }];
    }
    titles.set(key, [pageUrl]);
  }

  return [];
}

function duplicateDescription(
  document: Document,
  pageUrl: string,
): ErrorMessage[] {
  const descriptionElement = document.querySelector(
    'meta[name="description"]',
  );
  const rawDescription = descriptionElement?.getAttribute("content");

  if (rawDescription) {
    const key = rawDescription?.toLowerCase().trim() || "";
    const items = descriptions.get(key);
    if (items) {
      items.push(pageUrl);
      return [{
        msg: "DUPLICATE_DESCRIPTION",
        text: rawDescription,
        items,
      }];
    }
    descriptions.set(key, [pageUrl]);
  }

  return [];
}

function imgAlt(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const results: ErrorMessage[] = [];
  for (const img of document.querySelectorAll("img")) {
    const text = img.getAttribute("alt");
    if (text === null) {
      results.push({ msg: "IMG_MISSING_ALT", src: img.getAttribute("src") });
      continue;
    }

    const result = checkConformity(text, lang, rules, commonWords);

    switch (result?.error) {
      case "TOO_SHORT":
        results.push({
          msg: "IMG_SHORT_ALT",
          count: result.count,
          min: rules.min,
          unit: rules.unit,
          src: img.getAttribute("src"),
          text,
        });
        break;

      case "TOO_LONG":
        results.push({
          msg: "IMG_LONG_ALT",
          count: result.count,
          max: rules.max,
          unit: rules.unit,
          src: img.getAttribute("src"),
          text,
        });
        break;

      case "TOO_COMMON_WORDS":
        results.push({
          msg: "IMG_COMMON_WORDS_ALT",
          percentage: result.count,
          maxCommonWords: rules.maxCommonWords,
          src: img.getAttribute("src"),
          text,
        });
        break;
    }
  }

  return results;
}

function imgTitle(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const results: ErrorMessage[] = [];
  for (const img of document.querySelectorAll("img")) {
    const text = img.getAttribute("title");
    if (text === null) {
      results.push({
        msg: "IMG_MISSING_TITLE",
        src: img.getAttribute("src"),
      });
      continue;
    }

    const error = checkConformity(text, lang, rules, commonWords);

    switch (error?.error) {
      case "TOO_SHORT":
        results.push({
          msg: "IMG_SHORT_TITLE",
          count: error.count,
          min: rules.min,
          unit: rules.unit,
          src: img.getAttribute("src"),
          text,
        });
        break;

      case "TOO_LONG":
        results.push({
          msg: "IMG_LONG_TITLE",
          count: error.count,
          max: rules.max,
          unit: rules.unit,
          src: img.getAttribute("src"),
          text,
        });
        break;

      case "TOO_COMMON_WORDS":
        results.push({
          msg: "IMG_COMMON_WORDS_TITLE",
          percentage: error.count,
          maxCommonWords: rules.maxCommonWords,
          src: img.getAttribute("src"),
          text,
        });
        break;
    }
  }
  return results;
}

function title(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const text = document.title;

  if (!text) {
    return ["TITLE_MISSING"];
  }

  const errors = checkConformity(text, lang, rules, commonWords);

  switch (errors?.error) {
    case "TOO_SHORT":
      return [{
        msg: "TITLE_TOO_SHORT",
        count: errors.count,
        min: rules.min,
        unit: rules.unit,
        text,
      }];

    case "TOO_LONG":
      return [{
        msg: "TITLE_TOO_LONG",
        count: errors.count,
        max: rules.max,
        unit: rules.unit,
        text,
      }];

    case "TOO_COMMON_WORDS":
      return [{
        msg: "TITLE_COMMON_WORDS",
        percentage: errors.count,
        maxCommonWords: rules.maxCommonWords,
        text,
      }];
  }

  return [];
}

function description(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const descriptionElement = document.querySelector(
    'meta[name="description"]',
  );
  const text = descriptionElement?.getAttribute("content");
  if (!text) {
    return ["DESCRIPTION_MISSING"];
  }
  const error = checkConformity(text, lang, rules, commonWords);
  switch (error?.error) {
    case "TOO_SHORT":
      return [{
        msg: "DESCRIPTION_TOO_SHORT",
        count: error.count,
        min: rules.min,
        unit: rules.unit,
        text,
      }];

    case "TOO_LONG":
      return [{
        msg: "DESCRIPTION_TOO_LONG",
        count: error.count,
        max: rules.max,
        unit: rules.unit,
        text,
      }];

    case "TOO_COMMON_WORDS":
      return [{
        msg: "DESCRIPTION_COMMON_WORDS",
        percentage: error.count,
        maxCommonWords: rules.maxCommonWords,
        text,
      }];
  }

  return [];
}

function url(
  text: string,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const error = checkConformity(text, lang, rules, commonWords);

  switch (error?.error) {
    case "TOO_SHORT":
      return [{
        msg: "URL_TOO_SHORT",
        count: error.count,
        min: rules.min,
        unit: rules.unit,
        text,
      }];

    case "TOO_LONG":
      return [{
        msg: "URL_TOO_LONG",
        count: error.count,
        max: rules.max,
        unit: rules.unit,
        text,
      }];

    case "TOO_COMMON_WORDS":
      return [{
        msg: "URL_COMMON_WORDS",
        percentage: error.count,
        maxCommonWords: rules.maxCommonWords,
        text,
      }];
  }

  return [];
}

function body(
  document: Document,
  lang: string,
  rules: Rules,
  commonWords?: CommonWords,
): ErrorMessage[] {
  const text = document.body.textContent || "";
  const error = checkConformity(text, lang, rules, commonWords);

  switch (error?.error) {
    case "TOO_SHORT":
      return [{
        msg: "BODY_TOO_SHORT",
        count: error.count,
        min: rules.min,
        unit: rules.unit,
      }];

    case "TOO_LONG":
      return [{
        msg: "BODY_TOO_LONG",
        count: error.count,
        max: rules.max,
        unit: rules.unit,
      }];

    case "TOO_COMMON_WORDS":
      return [{
        msg: "BODY_COMMON_WORDS",
        percentage: error.count,
        maxCommonWords: rules.maxCommonWords,
      }];
  }

  return [];
}

interface ConformityError {
  error?: "TOO_SHORT" | "TOO_LONG" | "TOO_COMMON_WORDS";
  count: number;
}

function checkConformity(
  text: string,
  lang: string,
  rules: Rules,
  commonWords?: Set<string>,
): ConformityError | undefined {
  const { min, max, unit, maxCommonWords } = rules;
  const count = countUnits(text, lang, unit);

  if (min !== undefined && count < min) {
    return {
      count,
      error: "TOO_SHORT",
    };
  }

  if (max !== undefined && count > max) {
    return {
      count,
      error: "TOO_LONG",
    };
  }

  if (maxCommonWords !== undefined && commonWords) {
    const count = getCommonWordPercentage(text, lang, commonWords);
    if (count >= maxCommonWords) {
      return {
        count,
        error: "TOO_COMMON_WORDS",
      };
    }
  }
}

function countUnits(
  text: string,
  lang: string,
  unit: LengthUnit,
): number {
  switch (unit) {
    case "character":
      return text.length;
    case "grapheme":
    case "word":
    case "sentence": {
      const segmenter = new Intl.Segmenter(lang, {
        granularity: unit,
      });
      const segments = Array.from(segmenter.segment(text));
      if (unit === "word") {
        return segments.filter((s) => s.isWordLike).length;
      }
      return segments.length;
    }
  }
}

function getCommonWordPercentage(
  text: string,
  lang: string,
  commonWords: Set<string>,
): number {
  const segmenter = new Intl.Segmenter(lang, {
    granularity: "word",
  });

  const words = new Set<string>();
  for (const word of segmenter.segment(text)) {
    if (!word.isWordLike) {
      continue;
    }
    words.add(word.segment.toLowerCase());
  }

  if (words.size === 0) {
    return 0;
  }

  const common = words.intersection(commonWords);
  return (common.size / words.size) * 100;
}
