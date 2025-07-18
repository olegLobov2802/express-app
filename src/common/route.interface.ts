import { NextFunction, Request, Response, Router } from 'express';

import { IMiddleware } from './middleware.interface';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface IControllerRoute {
  path: string;
  cb: (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
  method: keyof Pick<Router, Method>;
  middlewares?: IMiddleware[];
}

export type ExpressReturnType = Response<any, Record<string, any>>;
