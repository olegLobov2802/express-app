import { NextFunction, Request, Response, Router } from 'express';

export interface IUserController {
  login: (req: Request, res: Response, next: NextFunction) => void;
  register: (req: Request, res: Response, next: NextFunction) => void;
  router: Router;
}
