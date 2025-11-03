import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authMiddleware } from '@/middlewares/authMiddleware';
import { validateUser } from '@/middlewares/validationMiddleware';

const router = Router();
const userController = new UserController();

// 获取所有用户
router.get('/', authMiddleware, userController.getUsers);

// 获取单个用户
router.get('/:id', authMiddleware, userController.getUserById);

// 创建用户
router.post('/', authMiddleware, validateUser, userController.createUser);

// 更新用户
router.put('/:id', authMiddleware, validateUser, userController.updateUser);

// 删除用户
router.delete('/:id', authMiddleware, userController.deleteUser);

export default router;
