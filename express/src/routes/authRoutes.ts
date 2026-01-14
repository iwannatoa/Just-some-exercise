import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import {
  validateLogin,
  validateRegister,
} from '@/middlewares/validationMiddleware';

const router = Router();
const authController = new AuthController();

// 注册
router.post('/register', validateRegister, authController.register);

// 登录
router.post('/login', validateLogin, authController.login);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 登出
router.post('/logout', authController.logout);

export default router;
