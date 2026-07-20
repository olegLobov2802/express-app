import { decode, JwtPayload } from 'jsonwebtoken';
import supertest from 'supertest';
import TestAgent from 'supertest/lib/agent';

import { App } from '../src/app';

let application: App;
let agent: TestAgent;

type AccessTokenResponse = {
  accessToken: string;
  expiresIn: number;
};

beforeAll(async () => {
  process.env.PORT = '0';
  process.env.AUTH_COOKIE_SECURE = 'false';

  const { boot } = await import('../src/main');
  const { app } = await boot;
  application = app;
  agent = supertest.agent(application.app);

  await agent.post('/users/register').send({
    email: 'userMail@mail.com',
    name: 'Test User',
    password: 'userPassword',
  });
});

describe('Users e2e', () => {
  it('Register - error', async () => {
    const res = await agent.post('/users/register').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    expect(res.statusCode).toBe(422);

    const body = res.body as {
      error: {
        code: string;
        message: string;
        details: Array<{ property: string }>;
      };
    };

    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details.some((d) => d.property === 'name')).toBe(true);
  });

  it('Login - success', async () => {
    const res = await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });

    const body = res.body as AccessTokenResponse;

    expect(body).toHaveProperty('accessToken');
    expect(body).not.toHaveProperty('refreshToken');
    expect(typeof body.expiresIn).toBe('number');
    expect(getRefreshCookie(res.headers)).toMatch(/^refreshToken=/);

    const payload = decode(body.accessToken) as JwtPayload | null;

    expect(payload).toBeTruthy();
    expect(payload?.email).toBe('userMail@mail.com');
    expect(typeof payload?.sub).toBe('number');
  });

  it('Login - error', async () => {
    const res = await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: '1234',
    });
    expect(res?.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'AUTH_ERROR',
        message: 'error auth',
      },
    });
  });

  it('Info - success', async () => {
    const login = await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    const res = await agent
      .get('/users/info')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.body?.userInfo?.email).toBe('userMail@mail.com');
  });

  it('Info - error', async () => {
    const res = await agent.get('/users/info').set('Authorization', 'Bearer 1');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'The user is not authorized',
      },
    });
  });

  it('Refresh - success via cookie', async () => {
    const session = supertest.agent(application.app);
    const login = await session.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    const oldCookie = getRefreshCookie(login.headers);

    const refresh = await session.post('/auth/refresh').send({});

    expect(refresh.statusCode).toBe(200);

    const body = refresh.body as AccessTokenResponse;

    expect(body.accessToken).toBeTruthy();
    expect(body).not.toHaveProperty('refreshToken');
    expect(typeof body.expiresIn).toBe('number');
    expect(getRefreshCookie(refresh.headers)).toBeTruthy();
    expect(getRefreshCookie(refresh.headers)).not.toBe(oldCookie);
  });

  it('Refresh - accepts X-Refresh-Token header', async () => {
    const login = await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    const refreshToken = parseRefreshTokenValue(getRefreshCookie(login.headers));

    const refresh = await agent
      .post('/auth/refresh')
      .set('X-Refresh-Token', refreshToken)
      .send({});

    expect(refresh.statusCode).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body).not.toHaveProperty('refreshToken');
  });

  it('Refresh - rejects reused token', async () => {
    const session = supertest.agent(application.app);
    const login = await session.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    const oldRefreshToken = parseRefreshTokenValue(
      getRefreshCookie(login.headers),
    );

    const firstRefresh = await session.post('/auth/refresh').send({});

    expect(firstRefresh.statusCode).toBe(200);

    const secondRefresh = await agent
      .post('/auth/refresh')
      .set('X-Refresh-Token', oldRefreshToken)
      .send({});

    expect(secondRefresh.statusCode).toBe(401);
    expect(secondRefresh.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      },
    });
  });

  it('Logout - success and refresh fails after', async () => {
    const session = supertest.agent(application.app);
    await session.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });

    const logout = await session.post('/auth/logout').send({});

    expect(logout.statusCode).toBe(200);
    expect(logout.body).toEqual({ logout: 'success' });

    const refresh = await session.post('/auth/refresh').send({});

    expect(refresh.statusCode).toBe(422);
  });
});

afterAll(() => {
  application.close();
  delete process.env.PORT;
  delete process.env.AUTH_COOKIE_SECURE;
});

function getSetCookie(headers: Record<string, unknown>): string[] {
  const setCookie = headers['set-cookie'];

  if (Array.isArray(setCookie)) {
    return setCookie;
  }

  return typeof setCookie === 'string' ? [setCookie] : [];
}

function getRefreshCookie(headers: Record<string, unknown>): string | undefined {
  return getSetCookie(headers).find((cookie) =>
    cookie.startsWith('refreshToken='),
  );
}

function parseRefreshTokenValue(setCookie: string | undefined): string {
  if (!setCookie) {
    throw new Error('refreshToken cookie is missing');
  }

  return setCookie.split(';')[0].slice('refreshToken='.length);
}
