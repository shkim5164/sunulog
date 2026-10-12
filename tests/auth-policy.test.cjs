const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./load-ts.cjs");
const { isAdminAccount, adminReturnPath, sameOrigin } =
  loadTs("lib/auth-policy.ts");

test("only the configured GitHub numeric identity is an administrator", () => {
  assert.equal(
    isAdminAccount({ provider: "github", providerAccountId: "12345" }, "12345"),
    true,
  );
  for (const account of [
    null,
    {},
    { provider: "google", providerAccountId: "12345" },
    { provider: "github", providerAccountId: "54321" },
  ])
    assert.equal(isAdminAccount(account, "12345"), false);
  for (const id of [undefined, "", "owner-name", "0", " 12345", "12345,54321"])
    assert.equal(
      isAdminAccount({ provider: "github", providerAccountId: "12345" }, id),
      false,
    );
});

test("login return paths stay inside the administrator screens", () => {
  assert.equal(adminReturnPath("/write?post=5"), "/write?post=5");
  assert.equal(adminReturnPath("/settings"), "/settings");
  for (const path of [
    undefined,
    "https://evil.example/write",
    "//evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/api/auth/signout",
    "/login",
    "/write\r\nLocation: https://evil.example",
  ])
    assert.equal(adminReturnPath(path), "/admin");
});

test("write origins must exactly match the configured site", () => {
  assert.equal(
    sameOrigin("https://sunulog.example", "https://sunulog.example"),
    true,
  );
  for (const origin of [
    null,
    "null",
    "https://evil.example",
    "https://sunulog.example.evil.example",
    "http://sunulog.example",
    "https://sunulog.example:444",
  ])
    assert.equal(sameOrigin(origin, "https://sunulog.example"), false);
  assert.equal(sameOrigin("https://sunulog.example", undefined), false);
});
