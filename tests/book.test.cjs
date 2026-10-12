const assert = require("node:assert/strict");
const { test } = require("node:test");
const matter = require("gray-matter");
const loadTs = require("./load-ts.cjs");
// Test the shared serialization and rendering contract without a browser or server.
const bookExports = loadTs("lib/book.ts");
const { normalizePageStyle, paperForPost, randomPaper, serializePost } =
  bookExports;

test("paper selection is stable for legacy posts and preserves an explicit choice", () => {
  const legacy = { id: 5, title: "세 번째 이야기" };
  assert.equal(paperForPost(legacy), paperForPost({ ...legacy }));
  assert.equal(paperForPost({ ...legacy, paper: "white" }), "white");
  for (let i = 0; i < 25; i++) assert.notEqual(randomPaper("cotton"), "cotton");
});

test("invalid style values are normalized and clamped", () => {
  const style = normalizePageStyle({
    fontSize: 999,
    lineHeight: NaN,
    font: "script",
    layout: "bad",
    margin: "bad",
  });
  assert.equal(style.fontSize, 24);
  assert.equal(style.lineHeight, 1.95);
  assert.equal(style.font, "serif");
  assert.equal(style.layout, "prose");
  assert.equal(
    normalizePageStyle({ fontSize: -4, lineHeight: 0 }).fontSize,
    14,
  );
});

test("Markdown round-trip preserves metadata, layout and authored page order", () => {
  const post = {
    id: 1234567,
    title: '제목: "별"\n다음 줄',
    author: "작가",
    date: "2026-10-12",
    tags: ["여행", "일기"],
    description: "한 줄: 소개",
    thumbnail: "/uploads/story-photo.jpg",
    paper: "vintage",
    pages: [
      {
        pageNumber: 1,
        content: "# 첫 장\n\n본문 **강조**",
        style: { layout: "title", align: "center", fontSize: 22 },
      },
      {
        pageNumber: 2,
        content: "> 둘째 장의 인용문",
        style: { layout: "quote", margin: "wide", font: "sans" },
      },
    ],
  };
  const parsed = matter(serializePost(post));
  assert.equal(parsed.data.title, post.title);
  assert.equal(parsed.data.id, post.id);
  assert.equal(parsed.data.paper, post.paper);
  assert.equal(parsed.data.thumbnail, post.thumbnail);
  assert.equal(parsed.data.pageStyles[0].align, "center");
  assert.equal(parsed.data.pageStyles[1].margin, "wide");
  assert.equal(parsed.data.pageStyles[1].font, "sans");
  assert.deepEqual(
    parsed.content.split("---page---").map((page) => page.trim()),
    post.pages.map((page) => page.content),
  );
});
