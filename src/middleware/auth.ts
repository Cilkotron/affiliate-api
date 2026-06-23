import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';


interface AuthenticatedUser extends JwtPayload {
  role: string;
}

type AuthedRequest = Request & { user?: AuthenticatedUser };

const authenticate = (req: AuthedRequest, res: Response, next: NextFunction): void => {
  const authHeader: string | undefined = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token: string = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorizeAdmin = (req: AuthedRequest, res: Response, next: NextFunction): void => {
  const role: string | undefined = req.user?.role;

  if (role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export { authenticate, authorizeAdmin };