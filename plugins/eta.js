import Eta from "../engines/eta.js";

export default function () {
  return (site) => {
    const eta = new Eta(site);

    site.engine([".eta"], eta);
  };
}
