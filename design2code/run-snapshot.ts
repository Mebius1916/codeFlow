import * as fs from "fs";
import { simplifyRawFigmaObjectWithImages } from "./core/extractors/pipeline/design-extractor.js";
import { createSnapshotWriter } from "./core/extractors/pipeline/utils/snapshot.js";
import codegen from "./core/codegen/index.js";

const inputFile = process.argv[2] || "test.json";
const outputDir = process.argv[3] || "./test";

void run();

async function run() {
  const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const design = await simplifyRawFigmaObjectWithImages(data, {
    fileKey: "xi5TJ73jny5zfNQC8dRtT4",
    token: "figd_-gzx6nRm4nOR4RhK8bDNbhNPVHcaEilP8dXHiLup",
  });

  const snapshot = createSnapshotWriter(outputDir, "test.json");
  snapshot("test", design.nodes, design.globalVars);

  const result = codegen(design);
  fs.writeFileSync(`${outputDir}/output.html`, result.html, "utf8");
  fs.writeFileSync(`${outputDir}/output.css`, result.css, "utf8");

  console.log("snapshots written to", outputDir);
}
