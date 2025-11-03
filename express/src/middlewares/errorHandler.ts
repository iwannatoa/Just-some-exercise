import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误
  console.error('错误详情:', err);

  // Mongoose 错误处理 (如果使用 MongoDB)
  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = { name: 'CastError', message, statusCode: 404 } as CustomError;
  }

  // Mongoose 重复键错误
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = '重复的字段值';
    error = { name: 'DuplicateField', message, statusCode: 400 } as CustomError;
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map(
      (val: any) => val.message
    );
    error = {
      name: 'ValidationError',
      message: message.join(', '),
      statusCode: 400,
    } as CustomError;
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    const message = '无效的令牌';
    error = {
      name: 'JsonWebTokenError',
      message,
      statusCode: 401,
    } as CustomError;
  }

  // JWT 过期错误
  if (err.name === 'TokenExpiredError') {
    const message = '令牌已过期';
    error = {
      name: 'TokenExpiredError',
      message,
      statusCode: 401,
    } as CustomError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
