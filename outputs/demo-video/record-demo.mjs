import { chromium } from "playwright";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(here, "yituling-demo.html");
const outDir = resolve(here, "rendered");
const webmPath = resolve(outDir, "yituling-demo.webm");
const mp4Path = resolve(outDir, "yituling-demo.mp4");
const screenshotPath = resolve(outDir, "yituling-demo-preview.png");

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: outDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
await page.waitForFunction(() => window.__demoReady === true);
await page.screenshot({ path: screenshotPath, fullPage: false });
await page.waitForFunction(() => window.__demoDone === true, undefined, { timeout: 95000 });
const video = page.video();
await context.close();
await browser.close();

const recordedPath = await video.path();
copyFileSync(recordedPath, webmPath);

execFileSync("ffmpeg", [
  "-y",
  "-i", webmPath,
  "-vf", "fps=30,format=yuv420p",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-movflags", "+faststart",
  mp4Path
], { stdio: "inherit" });

console.log(JSON.stringify({
  htmlPath,
  screenshotPath,
  webmPath,
  mp4Path
}, null, 2));
