import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from '@/logger/logger';
import _ from 'lodash';
import { I18nValidationError, I18nValidationException } from 'nestjs-i18n';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CustomException } from './custom.exception';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter')
  constructor(
    private readonly i18n: I18nService,
  ) { }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const method = req.method;
    const path = req.path;

    let code = 500;
    let message = '';
    let status = HttpStatus.OK;
    let logMsg = `${method} ${path}: `;
    if (exception instanceof I18nValidationException) {
      message = this.parseErrors(exception.errors);
      code = exception.getStatus();
      logMsg += message;
    } else if (exception instanceof UnauthorizedException) {
      message = exception.message || '未登录';
      status = code = 401;
      logMsg += `UnauthorizedException: ${message}`;
    } else if (exception instanceof HttpException) {
      const response = exception?.getResponse() as any;
      code = response?.code || 500;
      if (exception instanceof CustomException) {
        message = this.translate(code, exception.getExceptionParam()) 
      }
      message = message || response?.message || exception?.message || 'Unknown Error';
      status = exception.getStatus() || HttpStatus.OK;
      logMsg += `${(exception as any)?.stack || ''}`;
    } else {
      message = exception.message || 'Internal Server Error';
      logMsg += `${(exception as any)?.stack || ''}`;
    }
    this.logger.error(logMsg);
    res.status(status).json({
      code,
      message,
    });
  }

  private parseErrors(errors: I18nValidationError[]): string {
    const messages: string[] = [];
    this.recursiveParse(errors, messages);
    return messages.join('; ');
  }
  
  private async recursiveParse(errors: I18nValidationError[], messages: string[]) {
    errors = errors || [];
    for (const error of errors) {
      const constraints = error.constraints;
      if (!_.isEmpty(constraints)) {
        for (const [key, value] of Object.entries(constraints)) {
          const property = error.property;
          messages.push(this.getValidateMessage(key, { property }, value as string));
        }
      }
      if (_.isEmpty(error.children)) {
        await this.recursiveParse(error.children as I18nValidationError[], messages); // 递归处理子错误
      }
    }
  }

  private translate(code: number, param?: Record<string, any>): string {
    if (code && code !== 500) {
      return this.getMessage(code.toString(), param);
    }
    return '';
  }

  private getMessage(key: string, args?: any): string {
    key = "message." + key;
    return this.i18n.t(key, { lang: I18nContext.current()?.lang, args});
  }

  private getValidateMessage(key: string, args?: any, defaultValue?: string): string {
    key = "validation." + key;
    return this.i18n.t(key, { lang: I18nContext.current()?.lang, args, defaultValue });
  }
}
