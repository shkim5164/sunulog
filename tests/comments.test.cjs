const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./load-ts.cjs");
const { makeAnchor, resolveAnchor, treeText, rehypeAnnotations } =
  loadTs("lib/annotations.ts");
const { parseComment } = loadTs("lib/comment-validation.ts");

test("anchors survive inserted text and refuse deleted or ambiguous quotations", () => {
  const text = "한 줄의 기록. 오래 기억하고 싶은 문장. 마지막 이야기.";
  const quote = "오래 기억하고 싶은 문장";
  const start = text.indexOf(quote);
  const anchor = makeAnchor(text, 0, start, start + quote.length);
  assert.equal(resolveAnchor(text, anchor).start, start);
  assert.equal(resolveAnchor("새로운 서문. " + text, anchor).start, start + 8);
  assert.equal(resolveAnchor("다른 이야기만 남았다.", anchor), null);
  const repeated = makeAnchor("반복", 0, 0, 2);
  assert.equal(resolveAnchor("반복 그리고 반복", repeated), null);
});

test("overlapping highlights preserve text, formatting and all conversation ids", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "p",
        children: [
          { type: "text", value: "한 문장과 " },
          {
            type: "element",
            tagName: "strong",
            children: [{ type: "text", value: "여러 사람의 생각" }],
          },
        ],
      },
    ],
  };
  const original = treeText(tree);
  const threads = [
    { id: "first", color: "amber", anchor: makeAnchor(original, 0, 2, 11) },
    {
      id: "second",
      color: "rose",
      anchor: makeAnchor(original, 0, 7, original.length),
    },
  ];
  rehypeAnnotations({ threads, page: 0 })(tree);
  assert.equal(treeText(tree), original);
  assert.equal(
    tree.children[0].children.some((node) => node.tagName === "strong"),
    true,
  );
  const marks = [];
  const visit = (node) => {
    if (node.tagName === "mark") marks.push(node);
    (node.children || []).forEach(visit);
  };
  visit(tree);
  assert.ok(
    marks.some((mark) => mark.properties["data-thread-ids"] === "first second"),
  );
  assert.ok(
    marks.some((mark) => mark.properties.style.includes("linear-gradient")),
  );
});

test("table whitespace and raw HTML do not shift rendered text offsets", () => {
  const tree = {
    type: "root",
    children: [
      { type: "raw", value: "<hr>" },
      {
        type: "element",
        tagName: "table",
        children: [
          { type: "text", value: "\n" },
          {
            type: "element",
            tagName: "tr",
            children: [
              { type: "text", value: "\n" },
              {
                type: "element",
                tagName: "td",
                children: [{ type: "text", value: "선택 문장" }],
              },
            ],
          },
        ],
      },
    ],
  };
  assert.equal(treeText(tree), "선택 문장");
  rehypeAnnotations({
    threads: [
      { id: "table", color: "mint", anchor: makeAnchor("선택 문장", 0, 0, 5) },
    ],
    page: 0,
  })(tree);
  assert.equal(treeText(tree), "선택 문장");
});

test("anonymous comments validate lengths, ids, colors and reply structure", () => {
  const input = {
    id: "e4b824c9-3460-4f41-821b-ad489e681ad0",
    postId: 1,
    parentId: null,
    anchor: makeAnchor("문장", 0, 0, 2),
    color: "amber",
    author: "",
    body: " 좋은 이야기 ",
  };
  assert.equal(parseComment(input).author, "익명");
  assert.equal(parseComment(input).body, "좋은 이야기");
  for (const patch of [
    { body: " " },
    { body: "a".repeat(2001) },
    { author: "a".repeat(25) },
    { id: "bad" },
    { color: "url(javascript:bad)" },
    { anchor: null },
    { anchor: { ...input.anchor, page: -1 } },
    { anchor: { ...input.anchor, end: 600 } },
  ])
    assert.equal(parseComment({ ...input, ...patch }), null);
  assert.ok(parseComment({ ...input, parentId: input.id, anchor: null }));
  assert.equal(parseComment({ ...input, parentId: input.id }), null);
});
