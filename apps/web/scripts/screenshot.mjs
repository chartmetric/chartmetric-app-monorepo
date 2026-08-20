// Renders a route of the running dev server headlessly and saves a PNG, for
// the visual parity loop documented in docs/design/DESIGN_LANGUAGE.md.
// Usage: pnpm --filter web screenshot [route] [outfile] [light|dark]
// Requires the dev server on :5173; drives the system Chrome via
// playwright-core (no browser download).
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const route = process.argv[2] ?? "/sports/leagues";
const out = process.argv[3] ?? "screenshot.png";
const scheme = process.argv[4] === "dark" ? "dark" : "light";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];
const executablePath = CHROME_PATHS.find((path) => existsSync(path));
if (executablePath === undefined) {
  console.error("screenshot: no system Chrome/Chromium found");
  process.exit(1);
}

try {
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    colorScheme: scheme,
    deviceScaleFactor: 1,
    viewport: { height: 982, width: 1512 },
  });
  const page = await context.newPage();
  await page.addInitScript((value) => {
    localStorage.setItem("mantine-color-scheme-value", value);
  }, scheme);
  // preview.html mounts the app without RequiredAuthProvider; a client-side
  // pushState keeps the router inside that bundle (a full navigation would
  // load the authenticated entry and bounce to the hosted login).
  await page.goto("http://localhost:5173/preview.html", {
    waitUntil: "networkidle",
  });
  await page.evaluate((path) => {
    history.pushState({}, "", path);
    dispatchEvent(new PopStateEvent("popstate"));
  }, route);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out });
  await browser.close();
  console.log(`screenshot: saved ${out} (${route}, ${scheme})`);
} catch (error) {
  console.error(
    `screenshot: ${error instanceof Error ? error.message.split("\n", 1)[0] : String(error)}`,
  );
  process.exit(1);
}
