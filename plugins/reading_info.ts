import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to process */
  extensions?: string[];

  /** The words per minute a reader can read (default: 275) */
  wordsPerMinute?: number;
}

export const defaults: Options = {
  extensions: [".md"],
  wordsPerMinute: 275,
};

/**
 * A plugin to calculate the reading time of a content
 * @see https://lume.land/plugins/reading_info/
 */
export function readingInfo(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, (pages) => {
      pages.forEach((page) => {
        const { content, lang } = page.data;

        page.data.readingInfo = readingInfo(
          typeof content === "string" ? content : undefined,
          lang as string,
        );
      });
    });

    site.filter("readingInfo", readingInfo);
  };

  function readingInfo(content?: string, lang = "en"): ReadingInfo {
    if (!content || typeof content !== "string") {
      return {
        words: 0,
        minutes: 0,
        time: 0,
      };
    }

    const segmenter = new Intl.Segmenter(lang, {
      granularity: "word",
    });

    let wordCount = 0;
    for (const word of segmenter.segment(content)) {
      if (word.isWordLike) {
        wordCount++;
      }
    }

    const minutes = wordCount / options.wordsPerMinute;
    const time = Math.round(minutes * 60 * 1000);
    const displayTime = Math.ceil(parseFloat(minutes.toFixed(2)));

    return {
      words: wordCount,
      minutes: displayTime,
      time,
    };
  }
}

export default readingInfo;

export interface ReadingInfo {
  /** The number of words in the content */
  words: number;

  /** The number of minutes it takes to read the content */
  minutes: number;

  /** The number of milliseconds it takes to read the content */
  time: number;
}

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * Reading info
       * @see https://lume.land/plugins/reading_info/
       */
      readingInfo: ReadingInfo;
    }
  }
}
