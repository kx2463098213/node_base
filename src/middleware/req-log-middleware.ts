import { Request } from 'express';
import { Logger } from '@/logger/logger';
import _ from 'lodash';
import { isLocal } from '@/config';

export const RequestLog = () => {
  const logger = new Logger('req');

  return async (req: Request, res, next) => {
    const path = req.path;
    // 日志信息
    const skipLogPath = ['/deploy/live', '/deploy/ready', '/user/info'];
    const needLog = ((isLocal || +(process.env.REQ_LOG || '')) && !skipLogPath.includes(path));
    if (needLog) {
      const { ip, method, params, query, body } = req;
      let logFormat = `${ip} ${method} ${path}`
      if (!_.isEmpty(params)) {
        logFormat += `Params: ${JSON.stringify(params)};`;
      }
      if (!_.isEmpty(query)) {
        logFormat += `Query: ${JSON.stringify(query)};`;
      }
      if (!_.isEmpty(body)) {
        logFormat += `Body: ${JSON.stringify(body)};`;
      }
      logger.debug(logFormat);
    }
    next();
  };
};

// 日志信息脱敏
const getParam = (body: any) => {
  const logParams = _.clone(body?.data) || {};
  // const paramKeys = Object.keys(logParams);
  // const intersection = _.intersection(paramKeys, ['password', 'oldPassword', 'newPassword', 'pwd']);
  // _.each(intersection, (it) => {
  // 	const value = logParams[it];
  // 	if (value) {
  // 		logParams[it] = value.replace(/./g, '*');
  // 	}
  // });
  return logParams;
} 
