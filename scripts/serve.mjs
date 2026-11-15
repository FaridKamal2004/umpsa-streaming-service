import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(process.argv.includes("--dist") ? "dist" : ".");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};
const publicRoots = new Set(["index.html", "src"]);
createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const relative =
      pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = resolve(root, relative);
    if (
      !file.startsWith(root + sep) ||
      !publicRoots.has(relative.split("/")[0]) ||
      !(await stat(file)).isFile()
    )
      throw Error("Not found");
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Local: http://127.0.0.1:${port}`),
);
