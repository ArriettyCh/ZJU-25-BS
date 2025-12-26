import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

export const authRouter = Router();

// 注册
authRouter.post('/register', validateRegister, register);

// 登录
authRouter.post('/login', validateLogin, login);

// 获取当前用户信息
authRouter.get('/me', authenticateToken, getCurrentUser);

