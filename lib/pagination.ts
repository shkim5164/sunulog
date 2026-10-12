// Keep the same authored passage in view when a resized page reflows.
export function remapBookPosition(
  current: number,
  before: number[],
  after: number[],
  step: number,
) {
  if (current === 0) return 0;
  let source = 0;
  let offset = current - 1;
  while (source < before.length && offset >= before[source]) {
    offset -= before[source];
    source++;
  }
  const next =
    source === before.length
      ? after.reduce((sum, count) => sum + count, 1)
      : after.slice(0, source).reduce((sum, count) => sum + count, 1) +
        Math.min(offset, after[source] - 1);
  return Math.floor(next / step) * step;
}
