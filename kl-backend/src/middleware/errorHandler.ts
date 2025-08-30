import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const body: any = {
    error: err && err.message ? err.message : "Internal Server Error",
  };
  if (err && err.details) body.details = err.details;
  res.status(status).json(body);
}
