import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The key name to store the reading info value and the filter */
  name?: string;

  /** The list extensions this plugin applies to */
  extensions?: string[];

  /** The words per minute a reader can read (default: 275) */
  wordsPerMinute?: number;
}

export const defaults: Options = {
  name: "readingInfo",
  extensions: [".md"],
  wordsPerMinute: 275,
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, (page) => {
      const { content, lang } = page.data;

      page.data[options.name] = readingInfo(
        typeof content === "string" ? content : undefined,
        lang as string,
      );
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

export interface ReadingInfo {
  /** The number of words in the content */
  words: number;

  /** The number of minutes it takes to read the content */
  minutes: number;

  /** The number of milliseconds it takes to read the content */
  time: number;
}
