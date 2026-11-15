import { cp, mkdir } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("src", "dist/src", { recursive: true });
console.log("Built static site in dist/ (no runtime dependencies).");
