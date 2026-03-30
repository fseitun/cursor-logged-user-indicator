#!/usr/bin/env node
/**
 * Point Cursor/VS Code at the Open VSX gallery (see wiki):
 * https://github.com/eclipse-openvsx/openvsx/wiki/Using-Open-VSX-in-VS-Code
 *
 * Default path (Linux): /usr/share/cursor/resources/app/product.json
 * Override: node scripts/apply-openvsx-gallery.cjs /path/to/product.json
 * Or:       CURSOR_PRODUCT_JSON=/path/to/product.json node scripts/apply-openvsx-gallery.cjs
 *
 * Requires write permission on that file (usually: sudo node scripts/apply-openvsx-gallery.cjs).
 * Cursor/RPM/DEB updates typically replace product.json — re-run after upgrades.
 */
const fs = require("fs");

const OPENVSX_GALLERY = {
  serviceUrl: "https://open-vsx.org/vscode/gallery",
  itemUrl: "https://open-vsx.org/vscode/item",
  resourceUrlTemplate:
    "https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}",
  extensionUrlTemplate:
    "https://open-vsx.org/vscode/gallery/{publisher}/{name}/latest",
};

function defaultProductPath() {
  if (process.platform === "darwin") {
    return "/Applications/Cursor.app/Contents/Resources/app/product.json";
  }
  if (process.platform === "win32") {
    const base =
      process.env.LOCALAPPDATA ||
      require("path").join(process.env.USERPROFILE || "", "AppData", "Local");
    return require("path").join(
      base,
      "Programs",
      "cursor",
      "resources",
      "app",
      "product.json",
    );
  }
  return "/usr/share/cursor/resources/app/product.json";
}

const target =
  process.argv[2] || process.env.CURSOR_PRODUCT_JSON || defaultProductPath();

let raw;
try {
  raw = fs.readFileSync(target, "utf8");
} catch (e) {
  console.error(`Cannot read: ${target}`, e.message);
  process.exit(1);
}

const product = JSON.parse(raw);
const prev = product.extensionsGallery;
product.extensionsGallery = { ...OPENVSX_GALLERY };

const out = JSON.stringify(product, null, 2) + "\n";
const backup = `${target}.bak.${Date.now()}`;

try {
  fs.copyFileSync(target, backup);
  console.log("Backup:", backup);
} catch (e) {
  console.warn("Could not create backup (continuing):", e.message);
}

try {
  fs.writeFileSync(target, out, "utf8");
} catch (e) {
  console.error(`Cannot write: ${target}\n${e.message}`);
  console.error("\nTry: sudo node scripts/apply-openvsx-gallery.cjs", target);
  process.exit(1);
}

console.log("Updated extensionsGallery in", target);
console.log("Previous gallery serviceUrl was:", prev && prev.serviceUrl);
