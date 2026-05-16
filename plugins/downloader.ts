import type Site from "lume/core/site.ts";

import { merge } from "lume/core/utils/object.ts";
import { isUrl } from "lume/core/utils/path.ts";
import { read } from "lume/core/utils/read.ts";
import { posix } from "lume/deps/path.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

export interface Options {
	/** Domains to download images from */
	origins: string[];

	/** The folder where the images will be saved */
	folder: string;

	/** CSS selector the element needs to match */
	selector: string;
}

export const defaults: Options = {
	origins: [],
	folder: "/_assets",
	selector: "img,source,use",
};

export function downloader(userOptions?: Partial<Options>) {
	const options = merge(defaults, userOptions);

	return (site: Site) => {
		site.use(modifyUrls({ fn: download }));

		async function download(path: string, _page: Lume.Page, element?: Element) {
			const [pathAndQuery, frag] = path.split("#", 2);

			if (!pathAndQuery) {
				return path;
			}

			const fileIndex = site.files.findIndex((file) => file.data.url === pathAndQuery);
			const file = site.files[fileIndex];

			let url, content;

			if (file) {
				if (!file.src.entry.flags.has("remote")) {
					return path;
				}

				site.files.splice(fileIndex, 1);

				path = file.src.entry.src;
				content = await read(path, true);
				url = file.data.url;
			} else {
				if (
					!isUrl(path) ||
					!options.origins.includes(new URL(path).host) ||
					(element && !element.matches(options.selector))
				) {
					return path;
				}

				const res = await fetch(pathAndQuery);
				content = await res.arrayBuffer();
				content = new Uint8Array(content);
				const filename = posix.basename(pathAndQuery);
				const hash = await crypto.subtle.digest("SHA-1", content);
				const hashHex = new Uint8Array(hash).toHex();
				url = posix.join(options.folder, `${hashHex}-${filename}`);
			}

			const page = await site.getOrCreatePage(url);
			page.content = content;
			page.src.ext = posix.extname(path);

			return frag ? `${url}#${frag}` : url;
		}
	};
}

export default downloader;
