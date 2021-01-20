import textLoader from "../loaders/text.js";
import {
  cleanupAttrs,
  cleanupEnableBackground,
  cleanupIDs,
  cleanupNumericValues,
  collapseGroups,
  convertColors,
  convertEllipseToCircle,
  convertPathData,
  convertShapeToPath,
  convertStyleToAttrs,
  convertTransform,
  inlineStyles,
  mergePaths,
  minifyStyles,
  moveElemsAttrsToGroup,
  moveGroupAttrsToElems,
  removeComments,
  removeDesc,
  removeDoctype,
  removeEditorsNSData,
  removeEmptyAttrs,
  removeEmptyContainers,
  removeEmptyText,
  removeHiddenElems,
  removeMetadata,
  removeNonInheritableGroupAttrs,
  removeTitle,
  removeUnknownsAndDefaults,
  removeUnusedNS,
  removeUselessDefs,
  removeUselessStrokeAndFill,
  removeViewBox,
  removeXMLProcInst,
  sortDefsChildren,
  SVGO,
} from "../deps/svgo.js";

import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".svg"],
  options: {
    full: true,
    plugins: [
      { cleanupAttrs },
      { inlineStyles },
      { removeDoctype },
      { removeXMLProcInst },
      { removeComments },
      { removeMetadata },
      { removeTitle },
      { removeDesc },
      { removeUselessDefs },
      { removeEditorsNSData },
      { removeEmptyAttrs },
      { removeHiddenElems },
      { removeEmptyText },
      { removeEmptyContainers },
      { removeViewBox },
      { cleanupEnableBackground },
      { minifyStyles },
      { convertStyleToAttrs },
      { convertColors },
      { convertPathData },
      { convertTransform },
      { removeUnknownsAndDefaults },
      { removeNonInheritableGroupAttrs },
      { removeUselessStrokeAndFill },
      { removeUnusedNS },
      { cleanupIDs },
      { cleanupNumericValues },
      { moveElemsAttrsToGroup },
      { moveGroupAttrsToElems },
      { collapseGroups },
      { mergePaths },
      { convertShapeToPath },
      { convertEllipseToCircle },
      { sortDefsChildren },
    ],
  },
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);
  const svgo = new SVGO(options.options);

  return (site) => {
    site.loadAssets(options.extensions, textLoader);
    site.process(options.extensions, processor);

    async function processor(page) {
      const result = await svgo.optimize(page.content);
      page.content = result.data;
    }
  };
}
