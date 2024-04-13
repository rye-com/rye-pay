import { describe, it } from 'vitest';

import { RyePayError } from '../errors';

describe('RyePayError', () => {
  it('#is returns true for RyePayError instances', ({ expect }) => {
    expect(
      RyePayError.is(
        new RyePayError({
          code: 'BAD_AUTHORIZATION',
          message: '',
        })
      )
    ).toBe(true);
  });

  it('#is returns false for non-RyePayError instances', ({ expect }) => {
    expect(RyePayError.is(new Error())).toBe(false);
    expect(RyePayError.is(null)).toBe(false);
    expect(RyePayError.is(undefined)).toBe(false);
    expect(RyePayError.is({})).toBe(false);
  });

  it('can serialize to JSON', ({ expect }) => {
    const error = new RyePayError({
      code: 'INTERNAL',
      message: 'Something went wrong',
    });

    expect(JSON.stringify(error)).toMatchInlineSnapshot(
      `"{"code":"INTERNAL","message":"Something went wrong","name":"RyePayError"}"`
    );
  });
});
