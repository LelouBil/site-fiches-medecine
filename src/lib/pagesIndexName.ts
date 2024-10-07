import {GITHUB_REF_NAME} from "astro:env/client";

export const pagesIndexName = `pages-${GITHUB_REF_NAME}`