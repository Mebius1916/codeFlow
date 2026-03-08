import * as fs from "fs";
import { simplifyRawFigmaObjectWithImages } from "./core/extractors/pipeline/design-extractor.js";
import { createSnapshotWriter } from "./core/extractors/pipeline/utils/snapshot.js";
import { dumpRequestCacheToFile, restoreRequestCacheFromFile } from "./core/extractors/pipeline/utils/request-cache.js";
import codegen from "./core/codegen/index.js";
import type {
  ReconstructionStageName,
  ReconstructionStepFlags,
} from "./core/extractors/pipeline/reconstruction.js";

const inputFile = process.argv[2] || "test.json";
const outputDir = process.argv[3] || "/Users/bytedance/Desktop/code/d2c/figma-plugin/test";
const reconstructionSteps: ReconstructionStageName[] = [
  "occlusion",
  "spatial_merge",
  "reparenting",
  "layout_grouping",
  "list_inference",
  "adjacency",
  "semantic",
  "flattening",
];
const enabledSteps: ReconstructionStageName[] | null = [
  "occlusion",
  "spatial_merge",
  "reparenting",
  "layout_grouping",
  "list_inference",
  "adjacency",
  "semantic",
  "flattening",
];
const stepFlags = buildStepFlags(enabledSteps);

void run();

async function run() {
  await restoreRequestCacheFromFile(`${outputDir}/request-cache.json`);
  const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const design = await simplifyRawFigmaObjectWithImages(data, {
    fileKey: "xi5TJ73jny5zfNQC8dRtT4",
    token: "figd_XRA_s5xObTzwjkyOQOlm_XN4TRUMWjtcJAHhia6y",
    reconstruction: stepFlags ? { enabled: stepFlags } : undefined,
    assetsDir: `${outputDir}/assets`,
    assetsUrlPrefix: './assets',
  });
  const snapshot = createSnapshotWriter(outputDir, "test.json");
  snapshot("test", design.nodes, design.globalVars);
  const { html, css, assets } = codegen(design);
  fs.writeFileSync(`${outputDir}/output.html`, html, "utf8");
  fs.writeFileSync(`${outputDir}/output.css`, css, "utf8");

  // Write assets
  const assetsDir = `${outputDir}/assets`;
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  if (assets && assets.size > 0) {
    console.log(`Writing ${assets.size} assets to ${assetsDir}...`);
    for (const [filename, content] of assets) {
      fs.writeFileSync(`${assetsDir}/${filename}`, content, "utf8");
    }
  }

  console.log("snapshots written to", outputDir);
  await dumpRequestCacheToFile(`${outputDir}/request-cache.json`);
}

function buildStepFlags(
  steps: ReconstructionStageName[] | null,
): ReconstructionStepFlags | undefined {
  if (steps === null) return undefined;
  const flags: ReconstructionStepFlags = {};
  const enabled = new Set(steps);
  reconstructionSteps.forEach((step) => {
    flags[step] = enabled.has(step);
  });
  return flags;
}
