import { NextFunction, Request, Response } from 'express'
import { scopeStore } from '@/scope-store/index'
import { trace } from '@opentelemetry/api'
import { CustomRequest } from '@/modules/remote/uc/auth.guard'
import { Logger } from '@/logger/logger';
import { nanoid } from 'nanoid';

export class RequestContextMiddleware {
    private readonly logger = new Logger('cxtMiddlerWare');

  use(req: Request, _res: Response, next: NextFunction) {
    let requestId = trace.getActiveSpan()?.spanContext().traceId;
    const path = req.path;
    if (!requestId && !['/deploy/ready', '/deploy/live'].includes(path)) {
      this.logger.info('req path: %s, no requestId', path);
      requestId = nanoid(20);
    }
      
    scopeStore.run({
      request: req as CustomRequest,
      requestId,
    }, () => {
        next()
      },
    )
  }
}
