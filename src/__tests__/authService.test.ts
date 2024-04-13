import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';

import { AuthService } from '../authService';
import { RyePayError, RyePayErrorCode } from '../errors';

import { config } from '../config';

async function expectRyePayError(code: RyePayErrorCode, promise: Promise<unknown>) {
  try {
    await promise;
    expect.fail('Expected promise to reject');
  } catch (error) {
    expect(error).toBeInstanceOf(RyePayError);
    expect(error.code).toBe(code);
  }
}

describe('AuthService', () => {
  it('throws if provided a malformed JWT', async () => {
    const authService = AuthService.getInstance(() => Promise.resolve('not-a-jwt'));
    await expectRyePayError('BAD_AUTHORIZATION', authService.makeRequestOptions());
  });

  it('throws if provided a JWT with an invalid `aud`', async () => {
    const authService = AuthService.getInstance(() =>
      Promise.resolve(
        jwt.sign(
          {
            aud: 'not-a-valid-aud',
          },
          'secret',
          { algorithm: 'HS256' }
        )
      )
    );

    await expectRyePayError('BAD_AUTHORIZATION', authService.makeRequestOptions());
  });

  it.each([
    ['staging', config.environments.staging],
    ['production', config.environments.production],
  ])('routes to the correct environment: %s', async (_name, environment) => {
    const jwtString = jwt.sign({ aud: environment.audience }, 'secret', { algorithm: 'HS256' });
    const authService = AuthService.getInstance(() => Promise.resolve(jwtString));

    const options = await authService.makeRequestOptions();

    expect(options.headers).toEqual({
      Authorization: `Bearer ${jwtString}`,
    });
    expect(options.url).toBe(environment.url);
  });

  it('throws internal error if generateJWT is missing', async ({ expect }) => {
    // @ts-expect-error
    const authService = AuthService.getInstance();

    await expectRyePayError('INTERNAL', authService.makeRequestOptions());
  });
});
