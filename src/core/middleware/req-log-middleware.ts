import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@/common/logger/logger';
import _ from 'lodash';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('req');

  use(req: Request, _res: Response, next: NextFunction) {
    const { ip, method, path, params, query, body } = req;
    let logFormat = `${ip} ${method} ${path} `;

    // 当中间件在全局注册并使用 .forRoutes('*') 时，* 会被当作通配符路由参数，导致整个路径被捕获到 params[0] 中
    // params 应该只记录路由参数（如 /user/:id 中的 id），而不是整个路径
    const filteredParams = _.omit(params, ['0']);
    if (!_.isEmpty(filteredParams)) {
      logFormat += `Params: ${JSON.stringify(filteredParams)};`;
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
  const logParams = _.clone(body) || {};
  const paramKeys = Object.keys(logParams);
  const intersection = _.intersection(paramKeys, ['password', 'oldPassword', 'newPassword', 'pwd']);
  _.each(intersection, (it) => {
  	const value = logParams[it];
  	if (value) {
  		logParams[it] = '******';
  	}
  });
  return logParams;
}