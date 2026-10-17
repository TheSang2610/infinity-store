// Doc file nguon cho test. Chu hien thi da gom vao src/constants/; khi doc mot component (.tsx),
// ham nay thay nguoc HANG_SO.khoa bang chu that (title={X.a} -> title="...", {X.a} -> ...), va noi
// them cac hang so component import. Nho vay cac test doc ma nguon cu ("trang co / khong co cau X")
// van kiem dung noi dung hien thi, du chu nam o file hang so.
import { existsSync, readFileSync } from "node:fs";
import { readFile as readRaw } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);

/** Doan "export const NAME ..." (toi export ke tiep) trong file hang so. */
function exportBlock(text, name) {
  const start = text.search(new RegExp(`^export (?:const|function) ${name}\\b`, "m"));
  if (start < 0) return "";
  const next = text.slice(start + 1).search(/^export /m);
  return next < 0 ? text.slice(start) : text.slice(start, start + 1 + next);
}

function importedConstants(source) {
  const blocks = [];
  for (const match of source.matchAll(/import \{([^}]+)\} from "@\/(src\/constants\/[^"]+)"/g)) {
    const file = new URL(`${match[2]}.ts`, root);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const name of match[1].split(",").map((part) => part.trim().split(/\s+as\s+/)[0]).filter(Boolean)) {
      blocks.push({ name, block: exportBlock(text, name) });
    }
  }
  return blocks;
}

/** Thay HANG_SO.khoa (gia tri la chuoi don) bang chu that. */
function inline(content, blocks) {
  let out = content;
  for (const { name, block } of blocks) {
    for (const entry of block.matchAll(/^ {2}([A-Za-z0-9_]+): ("(?:[^"\\]|\\.)*"),$/gm)) {
      const [, key, literal] = entry;
      const value = JSON.parse(literal);
      const ref = `${name}.${key}`;
      out = out.split(`={${ref}}`).join(`=${JSON.stringify(value)}`);
      out = out.split(`{${ref}}`).join(value);
      out = out.replace(new RegExp(`\\b${name}\\.${key}\\b`, "g"), JSON.stringify(value));
    }
  }
  return out;
}

/** Component con / file du lieu import tuong doi (dot 3 tach component lon): ghep nguon de test doc du ca trang. */
function childComponents(source, fromFile, seen) {
  const parts = [];
  for (const match of source.matchAll(/from "(\.{1,2}\/[^"]+)"/g)) {
    const base = path.resolve(path.dirname(fromFile), match[1]);
    const child = [`${base}.tsx`, `${base}.ts`].find((file) => existsSync(file));
    if (!child || seen.has(child)) continue;
    seen.add(child);
    const text = readFileSync(child, "utf8");
    const blocks = importedConstants(text);
    parts.push(inline(text, blocks), ...blocks.map((item) => item.block), ...childComponents(text, child, seen));
  }
  return parts;
}

export async function readFile(file, encoding) {
  const content = await readRaw(file, encoding);
  const name = file instanceof URL ? fileURLToPath(file) : String(file);
  if (!encoding || !/[\\/](app|src[\\/]components)[\\/].*\.tsx$/.test(name)) return content;
  const blocks = importedConstants(content);
  return [inline(content, blocks), ...blocks.map((item) => item.block), ...childComponents(content, name, new Set([name]))].join("\n");
}
