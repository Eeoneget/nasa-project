import path from "node:path";
import fs from "node:fs/promises";

const PLOTS_ROOT = path.resolve(process.cwd(), "plots");
const ROOT_WITH_SEP = `${PLOTS_ROOT}${path.sep}`;

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8",
  ".py": "text/x-python; charset=utf-8"
};

function resolvePath(segments = []) {
  const resolved = path.resolve(PLOTS_ROOT, ...segments);
  if (!resolved.startsWith(ROOT_WITH_SEP)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

export async function GET(_request, { params }) {
  const segments = params?.segments ?? [];
  if (!Array.isArray(segments) || segments.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  let target;
  try {
    target = resolvePath(segments);
  } catch (error) {
    return new Response("Forbidden", { status: 403 });
  }

  let stats;
  try {
    stats = await fs.stat(target);
  } catch (error) {
    return new Response("Not found", { status: 404 });
  }

  if (stats.isDirectory()) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await fs.readFile(target);
  const ext = path.extname(target).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": stats.size.toString(),
      "Cache-Control": "public, max-age=60"
    }
  });
}