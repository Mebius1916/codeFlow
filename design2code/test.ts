import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { simplifyRawFigmaObjectWithImages } from "./core/extractors/pipeline/design-extractor.js";
import codegen from "./core/codegen/index.js";

const inputFile = "test.json";
const rootDir = "./test";
const d2cDir = `${rootDir}/d2c`;
const figmatocodeDir = `${rootDir}/figmatocode`;
const metaFile = `${rootDir}/meta.json`;
const d2cPng = `${rootDir}/d2c.png`;
const figmatocodePng = `${rootDir}/figmatocode.png`;
const scale = 2;

void main();

async function main() {
  await fsp.rm(d2cDir, { recursive: true, force: true });
  await fsp.rm(metaFile, { force: true });
  await fsp.rm(d2cPng, { force: true });
  await fsp.rm(figmatocodePng, { force: true });
  await fsp.rm(`${rootDir}/test.json`, { force: true });

  const data = normalizeFigmaJson(inputFile);
  const design = await simplifyRawFigmaObjectWithImages(data, {
    fileKey: "",
    token: "",
    skipAssetFetch: true,
  });

  await fsp.copyFile(
    path.resolve(process.cwd(), inputFile),
    path.resolve(process.cwd(), `${rootDir}/test.json`),
  );

  const result = codegen(design);
  await fsp.mkdir(d2cDir, { recursive: true });
  fs.writeFileSync(`${d2cDir}/index.html`, result.html, "utf8");
  fs.writeFileSync(`${d2cDir}/style.css`, result.css, "utf8");

  const viewport = result.size!;
  await fsp.writeFile(
    metaFile,
    JSON.stringify(
      {
        id: "S01",
        figmaUrl: "",
        complexity: "Medium",
        viewport: `${viewport.width}x${viewport.height}`,
        assetFreeMask: true,
        notes: "AutoLayout较少",
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  await writeResetCss();

  const browser = await chromium.launch();
  try {
    await renderPageToPng(browser, `${d2cDir}/index.html`, d2cPng, viewport);
    await renderPageToPng(browser, `${figmatocodeDir}/index.html`, figmatocodePng, viewport);
  } finally {
    await browser.close();
  }

  console.log("done:", rootDir);
}

function normalizeFigmaJson(filePath: string) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (raw && typeof raw === "object" && "body" in raw) {
    const body = (raw as any).body;
    const next = typeof body === "string" ? JSON.parse(body) : body;
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
    return next;
  }
  return raw;
}

async function writeResetCss() {
  const dst = path.resolve(process.cwd(), `${d2cDir}/reset.css`);
  await fsp.writeFile(
    dst,
    `* {
  box-sizing: border-box;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
}

button {
  border: none;
  background: none;
  padding: 0;
}
`,
    "utf8",
  );
}

async function renderPageToPng(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  htmlRelPath: string,
  outRelPath: string,
  viewport: { width: number; height: number },
) {
  const htmlPath = path.resolve(process.cwd(), htmlRelPath);
  const outPath = path.resolve(process.cwd(), outRelPath);
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: scale,
  });

  try {
    await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.every((l) => (l as HTMLLinkElement).sheet);
    });
    await page.waitForTimeout(50);
    await page.evaluate((target) => {
      const root = document.body?.firstElementChild as HTMLElement | null;
      if (!root) return;

      let minLeft = Infinity;
      let minTop = Infinity;
      let maxRight = -Infinity;
      let maxBottom = -Infinity;

      const nodes = root.querySelectorAll<HTMLElement>("*");
      const limit = Math.min(nodes.length, 5000);
      for (let i = 0; i < limit; i++) {
        const el = nodes[i];
        const r = el.getBoundingClientRect();
        if (!Number.isFinite(r.width) || !Number.isFinite(r.height)) continue;
        if (r.width <= 0 || r.height <= 0) continue;
        minLeft = Math.min(minLeft, r.left);
        minTop = Math.min(minTop, r.top);
        maxRight = Math.max(maxRight, r.right);
        maxBottom = Math.max(maxBottom, r.bottom);
      }

      const fallback = root.getBoundingClientRect();
      const contentWidth =
        Math.ceil((Number.isFinite(maxRight) ? maxRight : fallback.right) - (Number.isFinite(minLeft) ? minLeft : fallback.left)) ||
        Math.ceil(fallback.width) ||
        target.width;
      const contentHeight =
        Math.ceil((Number.isFinite(maxBottom) ? maxBottom : fallback.bottom) - (Number.isFinite(minTop) ? minTop : fallback.top)) ||
        Math.ceil(fallback.height) ||
        target.height;

      const s = Math.min(target.width / contentWidth, target.height / contentHeight, 1);

      let wrapper = root.querySelector<HTMLElement>(':scope > [data-render-wrapper="1"]');
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.setAttribute("data-render-wrapper", "1");
        while (root.firstChild) wrapper.appendChild(root.firstChild);
        root.appendChild(wrapper);
        wrapper.style.position = "absolute";
        wrapper.style.left = "0";
        wrapper.style.top = "0";
      }

      wrapper.style.transformOrigin = "0 0";
      wrapper.style.transform = `scale(${s})`;
      const scaledW = contentWidth * s;
      const scaledH = contentHeight * s;
      wrapper.style.left = `${Math.max(0, Math.round((target.width - scaledW) / 2))}px`;
      wrapper.style.top = `${Math.max(0, Math.round((target.height - scaledH) / 2))}px`;
    }, viewport);
    await page.waitForTimeout(50);
    await page.screenshot({ path: outPath, type: "png" });
  } finally {
    await page.close();
  }
}
