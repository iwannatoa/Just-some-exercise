import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 路由导入
import userRoutes from '@/routes/userRoutes';
import authRoutes from '@/routes/authRoutes';

// 中间件导入
import { errorHandler } from '@/middlewares/errorHandler';
import { requestLogger } from '@/middlewares/requestLogger';

dotenv.config();

class App {
  public app: Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet());

    // CORS配置
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      })
    );

    // 日志
    this.app.use(morgan('combined'));
    this.app.use(requestLogger);

    // 请求体解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API路由
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/auth', authRoutes);

    // 根路由
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Express TypeScript API',
        documentation: '/api/docs',
        version: '1.0.0',
      });
    });

    // 404处理
    this.app.use('*path', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `路由 ${req.method} ${req.originalUrl} 不存在`,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🎯 服务器运行在端口 ${this.port}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API文档: http://localhost:${this.port}/api/docs`);
    });
  }
}

export default App;
