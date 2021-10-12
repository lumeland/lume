export * from "https://unpkg.com/svgo@2.7.0/dist/svgo.browser.js";

/** SVGO options */
export interface SvgoOptions {
  multipass: boolean;
  plugins: unknown[];
  datauri: "base64" | "enc" | "unenc";
  js2svg: {
    doctypeStart?: string;
    doctypeEnd?: string;
    procInstStart?: string;
    procInstEnd?: string;
    tagOpenStart?: string;
    tagOpenEnd?: string;
    tagCloseStart?: string;
    tagCloseEnd?: string;
    tagShortStart?: string;
    tagShortEnd?: string;
    attrStart?: string;
    attrEnd?: string;
    commentStart?: string;
    commentEnd?: string;
    cdataStart?: string;
    cdataEnd?: string;
    textStart?: string;
    textEnd?: string;
    indent?: number;
    regEntities?: RegExp;
    regValEntities?: RegExp;
    encodeEntity?: (char: string) => string;
    pretty?: boolean;
    useShortTags?: boolean;
  };
}
