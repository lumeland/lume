import textLoader from "../loaders/text.js";
import {
  SVGO,
  cleanupAttrs,
  inlineStyles,
  removeDoctype,
  removeXMLProcInst,
  removeComments,
  removeMetadata,
  removeTitle,
  removeDesc,
  removeUselessDefs,
  removeEditorsNSData,
  removeEmptyAttrs,
  removeHiddenElems,
  removeEmptyText,
  removeEmptyContainers,
  removeViewBox,
  cleanupEnableBackground,
  minifyStyles,
  convertStyleToAttrs,
  convertColors,
  convertPathData,
  convertTransform,
  removeUnknownsAndDefaults,
  removeNonInheritableGroupAttrs,
  removeUselessStrokeAndFill,
  removeUnusedNS,
  cleanupIDs,
  cleanupNumericValues,
  moveElemsAttrsToGroup,
  moveGroupAttrsToElems,
  collapseGroups,
  mergePaths,
  convertShapeToPath,
  convertEllipseToCircle,
  sortDefsChildren,
} from "../deps/svgo.js";

const config = {
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
};

export default function () {
  const svgo = new SVGO(config);

  return (site) => {
    site.load([".svg"], textLoader, true);

    site.afterRender([".svg"], transform);

    async function transform(page) {
      const result = await svgo.optimize(page.rendered);
      page.rendered = result.data;
    }
  };
}
