import { Environment } from './types';

interface EnvironmentConfig {
  readonly audience: string;
  readonly url: string;
}

export const config = {
  environments: {
    local: {
      url: 'http://localhost:3000/v1/query',
      audience: 'dev.api.rye.com',
    },
    staging: {
      audience: 'staging.graphql.api.rye.com',
      url: process.env.CART_API_STAGING_URL ?? 'https://staging.graphql.api.rye.com/v1/query',
    },
    production: {
      audience: 'dev.api.rye.com',
      url: process.env.CART_API_PRODUCTION_URL ?? 'https://graphql.api.rye.com/v1/query',
    },
  } satisfies Record<Environment, EnvironmentConfig>,
};
