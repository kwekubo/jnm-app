/**
 * Where the app finds its course index. The index points at the course
 * manifest (jnm-meta.json), which in turn points at audio and content
 * objects in content-addressed storage under the same base URL.
 *
 * PLACEHOLDER: EAB hosting does not exist yet. Until it does, point this
 * at wherever the published content folder is served. During development
 * that can simply be your own computer, e.g.:
 *
 *   npx serve dist        →   http://<your-LAN-IP>:3000/eab-courses.json
 *
 * (A phone running Expo Go cannot see your computer's "localhost"; use
 * the machine's LAN address, which `npx expo start` prints.)
 */
export const COURSE_INDEX_URL =
  "http://192.168.1.24:3000/eab-courses.json";