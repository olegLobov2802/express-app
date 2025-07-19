import { NextFunction, Request, Response, Router } from 'express';

export interface IUserController {
  login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  router: Router;
  info: (req: Request, res: Response, next: NextFunction) => void;
}
