import { NextFunction, Request, Response, Router } from 'express';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface IControllerRoute {
  path: string;
  cb: (req: Request, res: Response, next: NextFunction) => void;
  method: keyof Pick<Router, Method>;
}

export type ExpressReturnType = Response<any, Record<string, any>>;
