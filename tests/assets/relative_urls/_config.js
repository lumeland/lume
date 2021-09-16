import lume from "../../../mod.ts";
import relative_urls from "../../../plugins/relative_urls.ts";

const site = lume();

site.use(relative_urls());

export default site;
