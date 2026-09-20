// Per-key async mutex. Read-modify-write on a JSON file has an `await` between the read and the
// write; without this, two concurrent requests can each read the old data and one update is lost.
const tails = new Map();

export function withLock(key, fn) {
  const prev = tails.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  const tail = run.catch(() => {});
  tails.set(key, tail);
  tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}
