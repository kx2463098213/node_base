import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express'
import { scopeStore } from '@/common/scope-utils'
import { CustomRequest } from '@/core/guards/auth.guard'
import { Logger } from '@/common/logger/logger';
import { nanoid } from 'nanoid';

@Injectable()
export class ScopeStoreMiddleware implements NestMiddleware {
  private readonly logger = new Logger('cxtMiddlerWare');

  use(req: Request, _res: Response, next: NextFunction) {
    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
      this.logger.info('req path: %s, no requestId', req.path);
      requestId = nanoid(20);
    }

    scopeStore.run({
      request: req as CustomRequest,
      requestId,
    }, () => {
        next();
      },
    )
  }
}