const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();

module.exports = function loadTs(filename) {
  const absolute = path.resolve(filename);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  cache.set(absolute, exports);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    URL,
    Math,
    Number,
    require: (name) =>
      name.startsWith("@/") ? loadTs(`${name.slice(2)}.ts`) : require(name),
  });
  return exports;
};
