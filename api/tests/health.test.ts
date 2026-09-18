import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("API basics", () => {
  it("GET /api/v1/health/live returns ok", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("unknown routes return the standard JSON error shape", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("protected routes reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/academic-years");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("malformed JSON returns 400, not 500", async () => {
    const res = await request(app)
      .post("/api/v1/academic-years")
      .set("Content-Type", "application/json")
      .send("{ not json");
    expect(res.status).toBe(400);
  });
});
