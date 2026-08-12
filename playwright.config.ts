import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { getServerUrl } from "./src/lib/server-url";

const EXTERNAL_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL;
const LOCAL_BASE_URL = process.env.PLAYWRIGHT_LOCAL_BASE_URL;
const SERVER_URL = EXTERNAL_BASE_URL ?? LOCAL_BASE_URL ?? getServerUrl();
const LOCAL_SERVER_PORT = new URL(SERVER_URL).port || "3000";
const REUSE_EXISTING_SERVER =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER?.toLowerCase() === "true";

const HEADLESS = process.env.HEADLESS
  ? process.env.HEADLESS.toLowerCase() === "true"
  : true;

const config: PlaywrightTestConfig = {
  // 50 seconds
  timeout: 70 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  // Add retry options
  retries: 1,
  // Add delay between retries
  // Keep the release suite deterministic and below the connection budget of
  // the isolated Neon branch. Local runs remain parallel for faster feedback.
  workers: process.env.CI ? 1 : 3,
  globalTeardown: require.resolve("./e2e/global-teardown.ts"),
  // Enable console logs in CI
  reporter: process.env.CI ? [["list"], ["html"]] : "list",
  use: {
    launchOptions: {
      slowMo: 200,
    },
    headless: HEADLESS,
    contextOptions: {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
      },
    },
    ignoreHTTPSErrors: true,
    video: "on-first-retry",
    trace: "on-first-retry",
    baseURL: SERVER_URL,
    viewport: { width: 1280, height: 720 },
    geolocation: { longitude: 2.3488, latitude: 48.8534 },
    permissions: ["geolocation"],
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  testDir: "e2e",
  // Only start the web server when no external base URL is provided
  ...(EXTERNAL_BASE_URL
    ? {}
    : {
        webServer: {
          command: `pnpm prisma migrate deploy && pnpm run build && pnpm exec next start -p ${LOCAL_SERVER_PORT}`,
          url: SERVER_URL,
          timeout: 120 * 1000,
          // Default to false to avoid silently reusing an unrelated app already
          // bound to :3000 in local/CI environments.
          reuseExistingServer: REUSE_EXISTING_SERVER,
        },
      }),
};

export default config;
