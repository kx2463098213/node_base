
import { ExecutionContext, Injectable } from '@nestjs/common'
import _ from 'lodash'
import url from 'url'
import { checkIs, isAvailableData } from '@/utils/util'
import { isLocal } from '@/config'
import { CustomException } from '@/exception/custom.exception'
import { UserService } from './user.service'
import { ErrorCode } from '@/exception/error-code'
import { DeepPartial } from 'typeorm'
import { UserDataDto } from './user.dto'
import { Request } from "express";

export type CurrentUser = DeepPartial<UserDataDto>
export interface CustomRequest extends Request {
  customToken?: string;
  token?: string;
  user?: CurrentUser
}

/**
 * 全局认证
 */
@Injectable()
export class UCAuthGuard {
  private whiteList = [
    '/',
    '/deploy/ready',
    '/deploy/live',
    new RegExp('/admin/')
  ]
  constructor(
    private ucService: UserService,
  ) { }

  resolveToken(request: CustomRequest) {
    const authorization = _.get(request.headers, 'authorization', '');
    return _.replace(authorization, `Bearer `, '');
  }

  checkIsWhiteList(pathname: string|null) {
    if (!pathname) {
      return false;
    }
    return checkIs(this.whiteList, pathname);
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as CustomRequest;
    const pathname = url.parse(request.url).pathname;
    const isInWhiteList = this.checkIsWhiteList(pathname);
    if (isInWhiteList) {
      return true;
    }
    // 需要先设置token
    request.token = this.resolveToken(request);;
    let userData: CurrentUser;
    if (isLocal) {
      const userDataStr = request.get('X-User-Data');
      if (userDataStr) {
        userData = JSON.parse(userDataStr);
      } else {
        userData = await this.ucService.getUserData();
      }
    } else {
      const userDataStr = request.get('X-User-Data');
      if (!userDataStr && isInWhiteList === false) {
        throw new CustomException(ErrorCode.NotLogin);
      }
      userData = JSON.parse(userDataStr as string);
    }
    const hasToken = isAvailableData(userData)
    if (!hasToken && isInWhiteList === false) {
      throw new CustomException(ErrorCode.NotLogin);
    }
    request.user = userData;
    return true;
  }
}
