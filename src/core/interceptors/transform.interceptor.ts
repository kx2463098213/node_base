import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { isLocal } from '@/core/config';
import { ResultDto } from '@/shared/remote/http.service';
import { Logger } from '@/common/logger/logger';
import { scopeUtils } from '@/common/utils/scope-utils';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResultDto<T>> {
  private readonly logger = new Logger('resp');
  private readonly blackList: string[];

  constructor(private readonly configService: ConfigService) {
    this.blackList = this.configService.get<string[]>('responseLogBlacklist') || [];
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResultDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const path = request.path;

    return next.handle().pipe(
      map(
        data => {
          const requestId = scopeUtils.getRequestId();
          // 日志信息
          const needLog = ((isLocal || +(process.env.REQ_LOG || '0')) && !this.blackList.includes(path))
          if (needLog) {
            const logFormat = `Response ${path} data: ${JSON.stringify(data)}`;
            this.logger.debug(logFormat);
          }
          return {
            data,
            code: 0,
            requestId,
          };
        },
      ),
    );
  }
}
