import { ErrorRequestHandler } from 'express';

export interface IExeptionFilter {
  catch: ErrorRequestHandler;
}
