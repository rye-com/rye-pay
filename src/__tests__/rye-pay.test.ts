import { describe, it, vi } from 'vitest';
import { randomUUID } from 'crypto';

import { createDeferred } from '../util/deferred';
import * as spreedly from '../util/spreedly';

import { RyePay } from '../rye-pay';
import { RyePayError } from '../errors';

const makeMockSpreedly = () => ({
  init: vi.fn(),
  on: vi.fn(),
  removeHandlers: vi.fn(),
});

vi.mock('../util/spreedly', () => ({
  loadSpreedly: vi.fn().mockResolvedValue({}),
  tryGetSpreedly: vi.fn().mockReturnValue(false),
}));

async function flushPromises() {
  return new Promise<void>(process.nextTick);
}

describe('RyePay', () => {
  it('throws when Spreedly is used before initialization', ({ expect }) => {
    const ryePay = new RyePay();

    expect(() => ryePay.setFieldType('number', 'text')).toThrow(RyePayError);
    expect(() => ryePay.setValue('number', 123352)).toThrow(RyePayError);
  });

  it('can be initialized', async ({ expect }) => {
    let resolved = false;

    const deferred = createDeferred();
    const spreedlyMock = makeMockSpreedly();

    const loadSpreedlySpy = vi.spyOn(spreedly, 'loadSpreedly').mockImplementation(() => {
      vi.spyOn(spreedly, 'tryGetSpreedly').mockReturnValue(spreedlyMock);
      return deferred.promise.then(() => spreedlyMock);
    });

    const ryePay = new RyePay();

    // Stub out network call
    const getEnvTokenSpy = vi.spyOn(ryePay as any, 'getEnvToken').mockResolvedValue('env-token');
    expect(loadSpreedlySpy).not.toHaveBeenCalled();

    // Init
    const cvvEl = randomUUID();
    const numberEl = randomUUID();
    ryePay
      .init({
        cvvEl,
        numberEl,
        generateJWT: () => Promise.resolve('fake-jwt'),
      })
      .then(() => {
        resolved = true;
      });

    // Should have started loading Spreedly
    expect(loadSpreedlySpy).toHaveBeenCalled();
    expect(getEnvTokenSpy).not.toHaveBeenCalled();
    expect(resolved).toBe(false);

    // Finish loading Spreedly
    deferred.resolve();
    await flushPromises();

    // Should have retrieved env token and init'd Spreedly
    expect(getEnvTokenSpy).toHaveBeenCalled();
    expect(spreedlyMock.init).toHaveBeenCalledWith('env-token', {
      cvvEl,
      numberEl,
    });

    // init() should have resolved
    expect(resolved).toBe(true);
  });
});
