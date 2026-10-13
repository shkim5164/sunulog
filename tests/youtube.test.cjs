const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./load-ts.cjs");
const { youtubeVideoId, normalizeYoutubeUrl } = loadTs("lib/youtube.ts");

test("YouTube video links normalize across share, mobile, shorts and embed formats", () => {
  const id = "M7lc1UVf-VE";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}&list=ignored`,
    ` https://youtu.be/${id}?si=share `,
    `https://m.youtube.com/watch?v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) {
    assert.equal(youtubeVideoId(url), id);
    assert.equal(normalizeYoutubeUrl(url), `https://www.youtube.com/watch?v=${id}`);
  }
});

test("invalid and untrusted URLs cannot become embed sources", () => {
  for (const value of [undefined, null, {}, 12, "", " ",
    "javascript:alert(1)", "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
    "https://youtube.com@evil.test/watch?v=M7lc1UVf-VE",
    "https://evil.test/embed/M7lc1UVf-VE", "https://youtube.com/playlist?list=foo",
    "https://youtube.com/watch?v=bad", "https://youtu.be/M7lc1UVf-VE/extra",
  ]) assert.equal(youtubeVideoId(value), undefined);
});
