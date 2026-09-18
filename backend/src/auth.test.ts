import assert from "node:assert/strict";
import test from "node:test";
import { app } from "./app";

const createServer = async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });
  const { port } = server.address() as { port: number };
  return { server, baseUrl: `http://127.0.0.1:${port}` };
};

test("register creates a company and an admin user with auth cookie", async () => {
  const { server, baseUrl } = await createServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Northstar Studio",
        name: "Alex Morgan",
        email: "alex@example.com",
        password: "StrongPass123!",
      }),
    });

    assert.equal(response.status, 201, "company registration should succeed");
    const setCookie = response.headers.get("set-cookie") ?? "";
    assert.match(setCookie, /flowforge_session=/, "auth cookie should be set");

    const json = await response.json();
    assert.equal(json.user.email, "alex@example.com");
    assert.equal(json.user.role, "ADMIN");
    assert.equal(json.user.status, "ACTIVE");
  } finally {
    server.close();
  }
});

test("login rejects invalid password without authenticating the user", async () => {
  const { server, baseUrl } = await createServer();

  try {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Northstar Studio",
        name: "Alex Morgan",
        email: "alex2@example.com",
        password: "StrongPass123!",
      }),
    });

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex2@example.com",
        password: "WrongPassword123!",
      }),
    });

    assert.equal(response.status, 401, "wrong password should be rejected");
  } finally {
    server.close();
  }
});
