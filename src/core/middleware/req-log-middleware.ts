import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/common/logger/logger';
import _ from 'lodash';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('req');

  use(req: Request, _res: Response, next: NextFunction) {
    const { ip, method, path, params, query, body } = req;
    let logFormat = `${ip} ${method} ${path}`
    if (!_.isEmpty(params)) {
      logFormat += `Params: ${JSON.stringify(params)};`;
    }
    if (!_.isEmpty(query)) {
      logFormat += `Query: ${JSON.stringify(query)};`;
    }
    if (!_.isEmpty(body)) {
      logFormat += `Body: ${JSON.stringify(getParam(body))};`;
    }
    this.logger.debug(logFormat);
    next();
  }
}

const getParam = (body: any) => {
  const logParams = _.clone(body?.data) || {};
  return logParams;
} 
