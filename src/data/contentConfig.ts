/**
 * Where the app finds its course index. PRODUCTION — the app's permanent
 * home at jenniamondo.app. With this file installed, the app works
 * anywhere in the world with your PC's servers off; the old Steps 0-2 of
 * the restart ritual are retired. To develop against a local content
 * server again, point this temporarily back at
 * http://<your-LAN-IP>:3000/eab-courses.json.
 */
export const COURSE_INDEX_URL =
  "https://jenniamondo.app/files/eab-courses.json";
