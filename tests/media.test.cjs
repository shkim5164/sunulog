const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = ts.transpileModule(fs.readFileSync("lib/media.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2021,
  },
}).outputText;
const media = {};
vm.runInNewContext(source, { exports: media, URL });

test("image addresses allow project paths and web images, reject unsafe protocols and credentials", () => {
  assert.equal(media.imageSource(" /uploads/photo.jpg "), "/uploads/photo.jpg");
  assert.equal(
    media.imageSource("https://example.com/photo.jpg?w=500"),
    "https://example.com/photo.jpg?w=500",
  );
  for (const value of [
    "//example.com/a.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml,abc",
    "https://user:pass@example.com/a.jpg",
    "/\\example.com/a.jpg",
    null,
    "",
  ]) {
    assert.equal(media.imageSource(value), undefined);
  }
});

test("an author's image takes priority over starter imagery and missing images have a default", () => {
  assert.equal(
    media.postImage({ id: 1, thumbnail: "/uploads/own.jpg" }),
    "/uploads/own.jpg",
  );
  assert.equal(media.postImage({ id: 1 }), "/images/forest-path.jpg");
  assert.equal(media.postImage({ id: 999 }), "/images/reading-window.jpg");
});
