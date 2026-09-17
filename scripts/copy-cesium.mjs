import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve("node_modules/cesium/Build/Cesium");
const destDir = path.resolve("public/cesium");

if (!fs.existsSync(srcDir)) {
  console.error("Cesium build directory not found. Please run npm install first.");
  process.exit(1);
}

const folders = ["Assets", "ThirdParty", "Widgets", "Workers"];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const folder of folders) {
  const src = path.join(srcDir, folder);
  const dest = path.join(destDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`✓ Copied Cesium ${folder} -> public/cesium/${folder}`);
  }
}

console.log("Cesium assets setup complete.");
