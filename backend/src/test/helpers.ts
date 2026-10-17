import assert from "node:assert/strict";
import request from "supertest";
import type { Express } from "express";

export function cookieOf(response: request.Response, name: string) {
  const raw = ([] as string[]).concat(response.headers["set-cookie"] ?? []);
  return raw.find((item) => item.startsWith(`${name}=`))?.split(";")[0] ?? "";
}

export async function loginAdmin(app: Express, username: string, password: string) {
  const response = await request(app).post("/api/admin/session").send({ username, password });
  assert.equal(response.status, 200, response.text);
  return cookieOf(response, "admin");
}
