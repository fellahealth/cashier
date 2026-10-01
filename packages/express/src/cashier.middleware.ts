import type { RequestHandler } from 'express';
import type { Cashier } from '@aios-medical/cashier';

declare module 'express-serve-static-core' {
  interface Request {
    cashier: Cashier;
  }
}

export const cashierMiddleware =
  (cashier: Cashier): RequestHandler =>
  (req, _res, next) => {
    req.cashier = cashier;
    next();
  };
