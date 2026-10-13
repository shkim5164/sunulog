const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./load-ts.cjs");
const { authConfiguration, authErrorMessage } = loadTs("lib/auth-config.ts");
const valid = {
  NEXTAUTH_URL: "https://blog.example",
  NEXTAUTH_SECRET: "test-only-secret-".repeat(3),
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH: "scrypt:" + "a".repeat(32) + ":" + "b".repeat(128),
};

test("auth diagnostics fail closed and never reveal credentials", () => {
  assert.equal(authConfiguration(valid).configured, true);
  assert.equal(authConfiguration(valid).origin, "https://blog.example");
  for (const key of Object.keys(valid)) {
    const result = authConfiguration({ ...valid, [key]: "" });
    assert.equal(result.configured, false);
    assert.ok(result.issues.some((issue) => issue.startsWith(key + ":")));
    assert.ok(!JSON.stringify(result).includes(valid.ADMIN_PASSWORD_HASH));
    assert.ok(!JSON.stringify(result).includes(valid.NEXTAUTH_SECRET));
  }
});

test("auth URL accepts local ports and rejects unsafe or path-based origins", () => {
  for (const url of ["http://localhost:3000", "http://127.0.0.1:3100", "http://[::1]:3000", "https://blog.example/"])
    assert.equal(authConfiguration({ ...valid, NEXTAUTH_URL: url }).configured, true);
  for (const url of ["http://blog.example", "https://user:password@blog.example", "https://blog.example/login", "https://blog.example?x=1", "javascript:alert(1)"])
    assert.equal(authConfiguration({ ...valid, NEXTAUTH_URL: url }).configured, false);
});

test("login errors distinguish credential failures from account rejection without echoing input", () => {
  assert.equal(authErrorMessage(undefined), "");
  assert.notEqual(authErrorMessage("AccessDenied"), authErrorMessage("TooManyAttempts"));
  assert.notEqual(authErrorMessage("CredentialsSignin"), authErrorMessage("Configuration"));
  assert.ok(!authErrorMessage("secret-error-detail").includes("secret-error-detail"));
});
