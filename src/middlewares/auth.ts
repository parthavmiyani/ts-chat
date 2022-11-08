import { Request, Response , NextFunction } from 'express';
import jwt from "./../utils/jwt";

async function auth(req: any, res: Response , next: NextFunction) {
  try {
    let token = req.headers["x-auth-token"]
    req.user = jwt.verify(token);
    next()
  } catch (error) {
    res.status(401).send("Unauthourized!")
  }
}


export default auth
