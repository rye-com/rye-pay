import { jwtDecode } from 'jwt-decode';

import { RyePayError } from './errors';
import type { GenerateJWTFunction } from './types';
import { config } from './config';

/**
 * The `AuthService` class provides methods to authorize outgoing API requests.
 */
export class AuthService {
  private static instance: AuthService;
  private generateJWT!: GenerateJWTFunction;

  private constructor(generateJWT: GenerateJWTFunction) {
    this.setGenerateJWT(generateJWT);
  }

  /**
   * The getInstance function returns an instance of the AuthService class, creating one if it doesn't
   * already exist.
   * @returns The `AuthService.instance` is being returned.
   */
  public static getInstance(generateJWT: GenerateJWTFunction): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(generateJWT);
    } else {
      AuthService.instance.setGenerateJWT(generateJWT);
    }

    return AuthService.instance;
  }

  public setGenerateJWT(generateJWT: GenerateJWTFunction) {
    this.generateJWT = generateJWT;
  }

  public async makeRequestOptions(): Promise<{
    headers: RequestInit['headers'];
    url: string;
  }> {
    if (this.generateJWT) {
      const token = await this.generateJWT();
      const endpoint = this.mapJWTEndpointOrThrow(token);

      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        url: endpoint,
      };
    }

    throw new RyePayError({
      code: 'INTERNAL',
      message:
        'Authentication method not provided. Did you forget to provide a `generateJWT` function when calling `ryePay.init`?',
    });
  }

  private mapJWTEndpointOrThrow(jwt: string) {
    try {
      const data = jwtDecode(jwt);
      const environment = Object.values(config.environments).find(
        (env) => env.audience === data.aud
      );

      if (environment) {
        return environment.url;
      }

      const validAudienceValues = Object.values(config.environments).map((env) => env.audience);
      throw new RyePayError({
        code: 'BAD_AUTHORIZATION',
        message: `The provided JWT token does not match any known Rye API environment. The \`aud\` field of your JWT must be one of the following values: ${validAudienceValues.join(
          ', '
        )}`,
      });
    } catch (error) {
      // `jwtDecode` throws when the token is malformed
      throw new RyePayError({
        cause: error,
        code: 'BAD_AUTHORIZATION',
        message:
          'The provided JWT token is malformed. Please check that your `generateJWT` function returns a valid JWT.',
      });
    }
  }
}
