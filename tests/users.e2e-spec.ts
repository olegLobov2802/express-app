import { decode, JwtPayload } from 'jsonwebtoken';
import supertest from 'supertest';
import TestAgent from 'supertest/lib/agent';

import { App } from '../src/app';
import { boot } from '../src/main';

let application: App;
let agent: TestAgent;

type TokenPairResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

beforeAll(async () => {
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

    const body = res.body as TokenPairResponse;

    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(typeof body.expiresIn).toBe('number');

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
    const login = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as {
      body: TokenPairResponse;
    };
    const res = (await agent
      .get('/users/info')
      .set('Authorization', `Bearer ${login.body.accessToken}`)) as {
      body?: {
        userInfo?: {
          email?: string;
        };
      };
    };
    expect(res?.body?.userInfo?.email).toBe('userMail@mail.com');
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

  it('Refresh - success', async () => {
    const login = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as { body: TokenPairResponse };

    const refresh = await agent.post('/users/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    expect(refresh.statusCode).toBe(200);

    const body = refresh.body as TokenPairResponse;

    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.refreshToken).not.toBe(login.body.refreshToken);
    expect(typeof body.expiresIn).toBe('number');
  });

  it('Refresh - rejects reused token', async () => {
    const login = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as { body: TokenPairResponse };

    const firstRefresh = await agent.post('/users/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    expect(firstRefresh.statusCode).toBe(200);

    const secondRefresh = await agent.post('/users/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    expect(secondRefresh.statusCode).toBe(401);
    expect(secondRefresh.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      },
    });
  });

  it('Logout - success and refresh fails after', async () => {
    const login = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as { body: TokenPairResponse };

    const logout = await agent.post('/users/logout').send({
      refreshToken: login.body.refreshToken,
    });

    expect(logout.statusCode).toBe(200);
    expect(logout.body).toEqual({ logout: 'success' });

    const refresh = await agent.post('/users/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    expect(refresh.statusCode).toBe(401);
  });
});

afterAll(() => {
  application.close();
});
