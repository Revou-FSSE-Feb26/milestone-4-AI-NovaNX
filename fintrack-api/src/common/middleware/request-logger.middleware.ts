import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../../auth/auth-user.interface';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    response.on('finish', () => {
      const user = (request as Request & { user?: AuthUser }).user;
      this.logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} user=${user?.id ?? 'anonymous'} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  }
}
