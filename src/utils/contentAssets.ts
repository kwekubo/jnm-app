import { COURSE_INDEX_URL } from "@/src/data/contentConfig";

/**
 * Illustrations are served as plain static files alongside the course
 * index (…/illustrations/jnm-lNN.png). Deriving their URLs from
 * COURSE_INDEX_URL means they follow the content server automatically —
 * your LAN IP today, https://jnm.esperanto.org.uk when Tim hosts it.
 */
export const contentAssetUrl = (asset: string): string =>
  COURSE_INDEX_URL.replace(/[^/]*$/, "") + asset;
