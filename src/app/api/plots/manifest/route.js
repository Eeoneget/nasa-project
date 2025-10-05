import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

const PLOTS_ROOT = path.join(process.cwd(), "plots");

const EXTENSION_TYPE = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".md": "doc",
  ".py": "script"
};

function classifyEntry(filename) {
  const ext = path.extname(filename).toLowerCase();
  return EXTENSION_TYPE[ext] ?? "other";
}

async function readExcerpt(filePath, maxChars = 320) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const trimmed = content.trim();
    if (!trimmed) return "";
    return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}...` : trimmed;
  } catch (error) {
    return "";
  }
}

export async function GET() {
  try {
    const entries = await fs.readdir(PLOTS_ROOT, { withFileTypes: true });
    const categories = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const categoryName = entry.name;
      const categoryPath = path.join(PLOTS_ROOT, categoryName);
      const files = await fs.readdir(categoryPath, { withFileTypes: true });

      const fileData = [];
      for (const file of files) {
        if (!file.isFile()) continue;
        const filePath = path.join(categoryPath, file.name);
        const stats = await fs.stat(filePath);
        const type = classifyEntry(file.name);
        const relativePath = path.posix.join(categoryName, file.name);

        const item = {
          name: file.name,
          path: relativePath,
          type,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };

        if (type === "doc") {
          item.excerpt = await readExcerpt(filePath);
        }

        fileData.push(item);
      }

      fileData.sort((a, b) => a.name.localeCompare(b.name));

      categories.push({
        name: categoryName,
        files: fileData
      });
    }

    categories.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to build plots manifest", error);
    return NextResponse.json({ error: "Unable to read plots manifest." }, { status: 500 });
  }
}
