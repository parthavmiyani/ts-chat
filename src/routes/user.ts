import { Router } from 'express';
const router = Router()
import UserController from '../controllers/UserController';


router.get('/', UserController.getAllUsers)
router.get('/:id', UserController.getUserById)
router.put('/:id', UserController.updateUserById)
router.delete('/:id', UserController.deleteUserById)

export default router;