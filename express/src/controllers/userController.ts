import { Request, Response, NextFunction } from 'express';

export class UserController {
  public getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 模拟从数据库获取用户
      const users = [
        { id: 1, name: '张三', email: 'zhang@example.com', role: 'user' },
        { id: 2, name: '李四', email: 'li@example.com', role: 'admin' },
      ];

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);

      // 模拟从数据库获取用户
      const user = {
        id: userId,
        name: '示例用户',
        email: 'user@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      // 模拟创建用户
      const newUser = {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: newUser,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email } = req.body;

      // 模拟更新用户
      const updatedUser = {
        id: userId,
        name,
        email,
        role: 'user',
        updatedAt: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: '用户更新成功',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);

      res.status(200).json({
        success: true,
        message: `用户 ${userId} 删除成功`,
      });
    } catch (error) {
      next(error);
    }
  };
}
