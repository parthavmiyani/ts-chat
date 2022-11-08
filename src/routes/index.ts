import { Router } from 'express';
const routes = Router();

import Auth from './../middlewares/auth'
import UsersRouter from './user';
import AuthRouter from './auth';


routes.use('/auth', AuthRouter);
routes.use('/user', Auth , UsersRouter);

export default routes;