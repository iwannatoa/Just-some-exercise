import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthController {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '7d';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      // 模拟密码哈希
      const hashedPassword = await bcrypt.hash(password, 12);

      // 模拟创建用户
      const user = {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      // 生成令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        this.JWT_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
          refreshToken,
          expiresIn: this.JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // 模拟用户验证
      const user = {
        id: 1,
        name: '示例用户',
        email: email,
        password: await bcrypt.hash('password123', 12), // 模拟哈希密码
        role: 'user',
      };

      // 模拟密码验证
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误',
        });
        return;
      }

      // 生成令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        this.JWT_SECRET,
        { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
          refreshToken,
          expiresIn: this.JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: '刷新令牌不能为空',
        });
        return;
      }

      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;

      if (decoded.type !== 'refresh') {
        res.status(401).json({
          success: false,
          message: '无效的刷新令牌',
        });
        return;
      }

      // 生成新的访问令牌
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        data: {
          token: newToken,
          expiresIn: this.JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '刷新令牌无效或已过期',
      });
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 在实际应用中，这里可能会将令牌加入黑名单
      res.status(200).json({
        success: true,
        message: '登出成功',
      });
    } catch (error) {
      next(error);
    }
  };
}
