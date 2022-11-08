import { Router } from 'express';
const router = Router()
import UserController from '../controllers/UserController';


router.post('/register', UserController.register)
router.post('/login', UserController.login)

export default router;