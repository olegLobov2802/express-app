import { RequestHandler, Response, Router } from 'express';
import { injectable } from 'inversify';

import { ILogger } from '../logger/loger.interface';

import { ExpressReturnType, IControllerRoute } from './route.interface';

export { Router } from 'express';

@injectable()
export abstract class BaseController {
  private readonly _router: Router;

  protected constructor(private logger: ILogger) {
    this._router = Router();
  }

  get router(): Router {
    return this._router;
  }

  public created(res: Response): ExpressReturnType {
    return res.sendStatus(201);
  }

  public send<T>(res: Response, code: number, message: T): ExpressReturnType {
    res.type('application/json');
    return res.status(code).json(message);
  }

  public ok<T>(res: Response, message: T): ExpressReturnType {
    return this.send<T>(res, 200, message);
  }

  protected bindRoutes(routes: IControllerRoute[]): void {
    for (const route of routes) {
      this.logger.log(`[${route.method}]: ${route.path}`);
      const middleware: RequestHandler[] = route.middlewares?.map(
        (m) => (req, res, next) => m.execute.call(m, req, res, next),
      );
      const handler: RequestHandler = (req, res, next) => {
        route.cb.call(this, req, res, next);
      };

      const pipeline = middleware ? [...middleware, handler] : handler;
      this.router[route.method](route.path, pipeline);
    }
  }
}
