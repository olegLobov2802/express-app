const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_SECRET', 'BCRYPT_ROUNDS'] as const;

const INSECURE_SECRETS = new Set([
  'your-jwt-secret',
  'secret',
  'changeme',
  'jwt-secret',
]);

const JWT_EXPIRES_IN_PATTERN = /^(\d+|[1-9]\d*[smhdw])$/i;

export function validateConfig(
  config: Record<string, string | undefined> = {},
): void {
  for (const key of REQUIRED_KEYS) {
    const value = config[key]?.trim();

    if (!value) {
      throw new Error(`[ConfigService]: missing required env variable ${key}`);
    }
  }

  const jwtSecret = config.JWT_SECRET?.trim() ?? '';

  if (jwtSecret.length < 16) {
    throw new Error(
      '[ConfigService]: JWT_SECRET must be at least 16 characters',
    );
  }

  if (INSECURE_SECRETS.has(jwtSecret.toLowerCase())) {
    throw new Error(
      '[ConfigService]: JWT_SECRET must not use a default placeholder',
    );
  }

  if (jwtSecret.toLowerCase().includes('your-jwt-secret')) {
    throw new Error(
      '[ConfigService]: JWT_SECRET must not use a default placeholder',
    );
  }

  const bcryptRounds = Number(config.BCRYPT_ROUNDS);

  if (
    !Number.isInteger(bcryptRounds) ||
    bcryptRounds < 4 ||
    bcryptRounds > 15
  ) {
    throw new Error(
      '[ConfigService]: BCRYPT_ROUNDS must be an integer between 4 and 15',
    );
  }

  const jwtExpiresIn = config.JWT_EXPIRES_IN?.trim();

  if (jwtExpiresIn && !JWT_EXPIRES_IN_PATTERN.test(jwtExpiresIn)) {
    throw new Error(
      '[ConfigService]: JWT_EXPIRES_IN must be a duration like 7d, 1h, or seconds',
    );
  }

  validateOptionalPositiveInt(
    config.RATE_LIMIT_WINDOW_MS,
    'RATE_LIMIT_WINDOW_MS',
  );
  validateOptionalPositiveInt(config.RATE_LIMIT_MAX, 'RATE_LIMIT_MAX');
}

function validateOptionalPositiveInt(
  value: string | undefined,
  key: string,
): void {
  if (value === undefined || value.trim() === '') {
    return;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`[ConfigService]: ${key} must be a positive integer`);
  }
}
