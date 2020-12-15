import Pug from "../engines/pug.js";

export default function () {
  return (site) => {
    const pug = new Pug(site);

    site.engine([".pug"], pug);
  };
}
