import { describe, it } from 'vitest';

import { createDeferred } from '../deferred';

describe('util/deferred', () => {
  it(
    'does not resolve the promise automatically',
    { fails: true, timeout: 1_000 },
    async ({ expect }) => {
      expect.assertions(0);

      const deferred = createDeferred();
      return deferred.promise
        .then(() => {
          expect(1).toBe(1);
        })
        .catch(() => {
          expect(1).toBe(1);
        });
    },
  );

  it('can resolve the promise', async ({ expect }) => {
    expect.assertions(1);

    const deferred = createDeferred();
    deferred.promise
      .then(() => {
        expect(1).toBe(1);
      })
      .catch(() => {
        expect.fail();
      });

    deferred.resolve();
  });

  it('`resolve` is idempotent', async ({ expect }) => {
    expect.assertions(1);
    const deferred = createDeferred();
    deferred.promise.then(() => {
      expect(1).toBe(1);
    });

    deferred.resolve();
    deferred.resolve();
  });
});
