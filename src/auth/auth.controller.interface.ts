import { NextFunction, Request, Response, Router } from 'express';

import { RefreshDto } from './dto/refresh.dto';

export interface IAuthController {
  refresh: (
    req: Request<{}, {}, RefreshDto>,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  logout: (
    req: Request<{}, {}, RefreshDto>,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  router: Router;
}
