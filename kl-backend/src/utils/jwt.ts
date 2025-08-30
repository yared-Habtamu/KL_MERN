import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(payload: object, expiresIn = "7d") {
  const opts: SignOptions = { expiresIn: expiresIn as unknown as any };
  return jwt.sign(payload as any, JWT_SECRET as unknown as any, opts);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET as any) as any;
}
