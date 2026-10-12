const assert = require("node:assert/strict");
const { test } = require("node:test");
const matter = require("gray-matter");
const loadTs = require("./load-ts.cjs");
const { defaultCoverLayout, normalizeCoverLayout, isCoverLayoutInput } =
  loadTs("lib/cover.ts");
const { serializePost } = loadTs("lib/book.ts");

test("cover frames stay on the page and missing fields recover without duplicate nodes", () => {
  const original = defaultCoverLayout();
  const layout = normalizeCoverLayout({
    version: 1,
    elements: [
      {
        ...original.elements[1],
        x: 200,
        y: -20,
        width: 200,
        height: 20,
        fontSize: Infinity,
      },
      original.elements[1],
    ],
  });
  assert.equal(layout.elements.length, 5);
  assert.equal(new Set(layout.elements.map((e) => e.id)).size, 5);
  const title = layout.elements.find((e) => e.field === "title");
  assert.equal(title.x, 0);
  assert.equal(title.y, 0);
  assert.equal(title.width, 100);
  assert.equal(title.fontSize, 52);
  for (const e of layout.elements) {
    assert(
      e.x >= 0 && e.y >= 0 && e.x + e.width <= 100 && e.y + e.height <= 100,
    );
  }
  assert.equal(normalizeCoverLayout(undefined), undefined);
});

test("unsafe images cannot be published or rendered, and images are bounded to six", () => {
  const bad = {
    id: "image-unsafe",
    kind: "image",
    src: "javascript:alert(1)",
    x: 0,
    y: 0,
    width: 20,
    height: 20,
  };
  assert.equal(isCoverLayoutInput({ version: 1, elements: [bad] }), false);
  assert.equal(
    normalizeCoverLayout({ version: 1, elements: [bad] }).elements.filter(
      (e) => e.kind === "image",
    ).length,
    0,
  );
  const many = Array.from({ length: 20 }, (_, i) => ({
    ...bad,
    id: `image-${i}`,
    src: "/images/bookshop.jpg",
  }));
  assert.equal(
    normalizeCoverLayout({ version: 1, elements: many }).elements.filter(
      (e) => e.kind === "image",
    ).length,
    6,
  );
  assert.equal(isCoverLayoutInput({ version: 1, elements: many }), false);
});

test("Markdown round-trip preserves cover positions, text settings, images and layer order", () => {
  const cover = defaultCoverLayout();
  cover.elements[1] = {
    ...cover.elements[1],
    x: 5,
    y: 9,
    align: "left",
    fontSize: 38,
  };
  cover.elements[2].hidden = true;
  cover.elements.unshift({
    id: "image-one",
    kind: "image",
    src: "/uploads/cover.jpg",
    alt: "창가의 책",
    x: 7,
    y: 35,
    width: 86,
    height: 40,
    fit: "contain",
    hidden: false,
  });
  const post = {
    id: 345,
    title: "표지",
    author: "작가",
    date: "2026-10-12",
    paper: "white",
    pages: [{ pageNumber: 1, content: "본문" }],
    coverLayout: cover,
  };
  const parsed = matter(serializePost(post));
  assert.deepEqual(parsed.data.coverLayout, JSON.parse(JSON.stringify(cover)));
  assert.equal(parsed.content.trim(), "본문");
  assert.equal(isCoverLayoutInput(parsed.data.coverLayout), true);
});
