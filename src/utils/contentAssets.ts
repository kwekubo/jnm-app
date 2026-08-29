import { COURSE_INDEX_URL } from "@/src/data/contentConfig";

/**
 * Illustrations are served as plain static files alongside the course
 * index (…/illustrations/jnm-lNN.png). Deriving their URLs from
 * COURSE_INDEX_URL means they follow the content server automatically —
 * the app's permanent home at https://jenniamondo.app/files.
 */
export const contentAssetUrl = (asset: string): string =>
  COURSE_INDEX_URL.replace(/[^/]*$/, "") + asset;
