import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { isLocal } from '@/core/config';
import { ResultDto } from '@/shared/remote/http.service';
import { Logger } from '@/common/logger/logger';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResultDto<T>> {
  private readonly logger = new Logger('resp');

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResultDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const path = request.path;
    const blackList = ['/deploy/live', '/deploy/ready', '/user/info'];
    
    return next.handle().pipe(
      map(
        data => {
          const traceId = '';
          // 日志信息
          const needLog = ((isLocal || +(process.env.REQ_LOG || '0')) && !blackList.includes(path))
          if (needLog) {
            const logFormat = `Response ${path} data: ${JSON.stringify(data)}`;
            this.logger.debug(logFormat);
          }
          return {
            data,
            code: 0,
            traceId,
          };
        },
      ),
    );
  }
}
