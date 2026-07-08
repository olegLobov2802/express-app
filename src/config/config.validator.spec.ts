import { validateConfig } from './config.validator';

const validConfig = {
  DATABASE_URL:
    'postgresql://express_app:express_app@localhost:5432/express_app',
  JWT_SECRET: 'super-secret-key-32chars-min!!',
  BCRYPT_ROUNDS: '10',
};

describe('validateConfig', () => {
  it('accepts valid config', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('accepts optional auth and rate limit settings', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        JWT_EXPIRES_IN: '7d',
        JWT_ACCESS_EXPIRES_IN: '1h',
        JWT_REFRESH_EXPIRES_IN: '30d',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX: '10',
      }),
    ).not.toThrow();
  });

  it('rejects missing required keys', () => {
    expect(() => validateConfig({ ...validConfig, JWT_SECRET: '' })).toThrow(
      'missing required env variable JWT_SECRET',
    );
  });

  it('rejects short secret', () => {
    expect(() =>
      validateConfig({ ...validConfig, JWT_SECRET: 'short-secret' }),
    ).toThrow('JWT_SECRET must be at least 16 characters');
  });

  it('rejects placeholder secret', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        JWT_SECRET: 'prefix-your-jwt-secret-suffix',
      }),
    ).toThrow('must not use a default placeholder');
  });

  it('rejects invalid salt', () => {
    expect(() =>
      validateConfig({ ...validConfig, BCRYPT_ROUNDS: 'NaN' }),
    ).toThrow('BCRYPT_ROUNDS must be an integer between 4 and 15');
  });

  it('rejects invalid JWT_EXPIRES_IN', () => {
    expect(() =>
      validateConfig({ ...validConfig, JWT_EXPIRES_IN: 'forever' }),
    ).toThrow('JWT_EXPIRES_IN must be a duration');
  });

  it('rejects invalid JWT_ACCESS_EXPIRES_IN', () => {
    expect(() =>
      validateConfig({ ...validConfig, JWT_ACCESS_EXPIRES_IN: 'forever' }),
    ).toThrow('JWT_ACCESS_EXPIRES_IN must be a duration');
  });

  it('rejects invalid rate limit values', () => {
    expect(() =>
      validateConfig({ ...validConfig, RATE_LIMIT_MAX: '0' }),
    ).toThrow('RATE_LIMIT_MAX must be a positive integer');
  });
});
