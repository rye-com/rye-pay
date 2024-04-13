export function createDeferred() {
  let resolve!: (value?: void) => void;

  const promise = new Promise<void>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}
