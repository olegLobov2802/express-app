import supertest from 'supertest';
import TestAgent from 'supertest/lib/agent';

import { App } from '../src/app';
import { boot } from '../src/main';

let application: App;
let agent: TestAgent;

beforeAll(async () => {
  const { app } = await boot;
  application = app;
  agent = supertest.agent(application.app);
});

describe('Users e2e', () => {
  it('Register - error', async () => {
    const res = await agent.post('/users/register').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });
    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ property: 'name' }),
        ]),
      },
    });
  });

  it('Login - success', async () => {
    // const agent = supertest.agent(application.app);
    const res = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as {
      body?: {
        jwt?: string;
      };
    };
    expect(res?.body?.jwt).not.toBeUndefined();
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
    // const agent = supertest.agent(application.app);
    const login = (await agent.post('/users/login').send({
      email: 'userMail@mail.com',
      password: 'userPassword',
    })) as {
      body: {
        jwt: string;
      };
    };
    const res = (await agent
      .get('/users/info')
      .set('Authorization', `Bearer ${login.body.jwt}`)) as {
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
});

afterAll(() => {
  application.close();
});
