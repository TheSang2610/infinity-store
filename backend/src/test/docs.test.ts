import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import request from "supertest";

process.env.FRONTEND_URL = "http://localhost:3000";

import { createApp, SWAGGER_UI_CDN } from "../app";
import { apiSpec } from "../docs/openapi";
import { BANG } from "../docs/paths";

const ROUTES_DIR = path.resolve(__dirname, "../routes");

/**
 * Doc route that tu ma nguon routes/*.ts (+ tien to gan trong routes/index.ts), de bat duoc
 * truong hop them route moi ma quen khai trong docs/paths.ts, hoac doi duong dan ma tai lieu
 * van ghi duong cu.
 */
function realRoutes() {
  const index = readFileSync(path.join(ROUTES_DIR, "index.ts"), "utf8");
  const prefixOf = new Map<string, string>();
  for (const m of index.matchAll(/apiRoutes\.use\("([^"]*)",\s*(\w+)\)/g)) prefixOf.set(m[2], m[1]);

  const found = new Set<string>();
  for (const file of readdirSync(ROUTES_DIR).filter((name) => name.endsWith(".routes.ts"))) {
    const source = readFileSync(path.join(ROUTES_DIR, file), "utf8");
    for (const m of source.matchAll(/(\w+)\.(get|post|put|patch|delete)\(\s*(\[[^\]]*\]|"[^"]*")/g)) {
      const prefix = prefixOf.get(m[1]);
      assert.ok(prefix !== undefined, `${file}: router ${m[1]} chua gan trong routes/index.ts`);
      const subPaths = [...m[3].matchAll(/"([^"]*)"/g)].map((s) => s[1]);
      for (const sub of subPaths) {
        const full = `/api${prefix === "/" ? "" : prefix}${sub === "/" ? "" : sub}`;
        found.add(`${m[2]} ${full}`);
      }
    }
  }
  return found;
}

describe("Tai lieu API (Swagger)", () => {
  test("moi route that deu co trong tai lieu va nguoc lai", () => {
    const real = realRoutes();
    const documented = new Set(BANG.map(([method, route]) => `${method} ${route}`));
    const missing = [...real].filter((key) => !documented.has(key));
    const extra = [...documented].filter((key) => !real.has(key));
    assert.deepEqual(missing, [], "Route chua khai trong src/docs/paths.ts");
    assert.deepEqual(extra, [], "Tai lieu ghi route khong ton tai");
    assert.ok(real.size > 90, `chi doc duoc ${real.size} route - bieu thuc doc route co the da hong`);
  });

  test("khong khai trung mot endpoint", () => {
    const keys = BANG.map(([method, route]) => `${method} ${route}`);
    assert.equal(new Set(keys).size, keys.length);
  });

  test("moi $ref deu tro toi schema co that", () => {
    const refs = [...JSON.stringify(apiSpec).matchAll(/"\$ref":"#\/components\/schemas\/(\w+)"/g)].map((m) => m[1]);
    for (const name of new Set(refs)) assert.ok(name in apiSpec.components.schemas, `thieu schema ${name}`);
  });

  test("GET /api/docs.json tra ban dac ta, /api/docs tra giao dien", async () => {
    const app = createApp();
    const json = await request(app).get("/api/docs.json");
    assert.equal(json.status, 200);
    assert.equal(json.body.openapi, "3.0.3");
    assert.ok(json.body.paths["/api/orders"].post);

    const ui = await request(app).get("/api/docs/");
    assert.equal(ui.status, 200);
    assert.match(ui.text, /swagger-ui/);
  });

  test("trang tai lieu khong chuyen huong va tep CSS/JS dung duong tuyet doi (mo qua Next.js duoc)", async () => {
    const app = createApp();
    // Next.js bo dau "/" cuoi; neu backend lai chuyen huong them "/" thi trinh duyet lap vo han.
    for (const url of ["/api/docs", "/api/docs/"]) {
      const res = await request(app).get(url);
      assert.equal(res.status, 200, url);
      assert.match(res.headers["content-type"], /html/);
      assert.doesNotMatch(res.text, /(href|src)="\.\//, "con duong dan tuong doi ./");
    }
    // CSS/JS lay tu CDN dung phien ban dang cai (tren Vercel tep tinh trong node_modules khong duoc dong goi).
    const html = (await request(app).get("/api/docs")).text;
    const installed = JSON.parse(readFileSync(require.resolve("swagger-ui-dist/package.json"), "utf8")).version;
    assert.equal(SWAGGER_UI_CDN, `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${installed}`, "doi SWAGGER_UI_CDN trong app.ts cho trung");
    assert.ok(html.includes(`${SWAGGER_UI_CDN}/swagger-ui.css`));
    assert.ok(html.includes(`${SWAGGER_UI_CDN}/swagger-ui-bundle.js`));
    assert.ok(html.includes('src="/api/docs/swagger-ui-init.js"'));
    const init = await request(app).get("/api/docs/swagger-ui-init.js");
    assert.equal(init.status, 200);
    assert.match(init.text, /Infinity Store API/);
  });
});
