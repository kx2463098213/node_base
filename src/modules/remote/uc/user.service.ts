import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import _ from 'lodash'
import { HttpService } from '../http.service'
import {
  EmployeesByAdminApiResDto, EmployeesInfoDto, UcPlatform,
  UserAdminApiResDto, UserDataDto,
} from './user.dto'
import { scopeUtils } from '@/scope-store/index'
import { CustomException } from '@/exception/custom.exception'
import { ErrorCode } from '@/exception/error-code'

@Injectable()
export class UserService {
  private readonly ucEndpoint: string

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {
    this.ucEndpoint = this.config.get('uc.endpoint') as string;
  }

  getUserToken() : string {
    const originalToken = scopeUtils.getRequest()?.token;
    if (!originalToken) {
      throw new CustomException(ErrorCode.NotLogin);
    }
    return `Bearer ${originalToken}`;
  }


  async getUserData(): Promise<UserDataDto> {
    const ucToken = this.getUserToken();
    if (!ucToken) {
      throw new CustomException(ErrorCode.NotLogin);
    }
    const url = this.getUrl('/user/info');
    const resp = await this.httpService.post<any, UserDataDto>(url, {}, {
      headers: {
        Authorization: ucToken,
      }
    });
    return resp.data;
  }

  async getTenantAdminInfo(tenantId: number): Promise<UserDataDto> {
    const url = this.getUrl('/admin/getBiByCompanyId');
    const resp = await this.httpService.post<any, UserDataDto>(url, {
      data: {
        companyId: tenantId,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getTenantAdminList(tenantIdList: number[]): Promise<UserDataDto[]> {
    tenantIdList = this.simplifyArray(tenantIdList)
    if (!tenantIdList.length) {
      return [];
    }
    const url = this.getUrl('/admin/batchGetBiByCompanyIds');
    const resp = await this.httpService.post<any, UserDataDto[]>(url, {
      data: {
        companyIds: tenantIdList,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getUsersByAdminApi(ids: number[]): Promise<UserAdminApiResDto> {
    ids = this.simplifyArray(ids)
    if (!ids.length) {
      return {
        items: [],
        total: 0,
      }
    }
    const url = this.getUrl('/admin/user/list');
    const resp = await this.httpService.post<any, UserAdminApiResDto>(url, {
      data: { 
        ids 
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getEmployeesByAdminApi(userIds: number[]): Promise<EmployeesByAdminApiResDto> {
    userIds = this.simplifyArray(userIds)
    if (!userIds.length) {
      return {
        items: [],
        total: 0,
      }
    }
    const url = this.getUrl('/admin/employee/list');
    const resp = await this.httpService.post<any, EmployeesByAdminApiResDto>(url, {
      data: {
        ids: userIds,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async removeEmployee(companyId: string, userIds: string[]) {
    const ids = this.simplifyArray(userIds)
    if (!companyId || !ids.length) {
      return {
        success: [],
        err: {
          ids: [],
        },
      }
    }
    const url = this.getUrl('/admin/employee/remove');
    const resp = await this.httpService.post(url, {
      data: {
        companyId: companyId,
        ids: ids,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getEmployeesListApi(employeeIds: string[]): Promise<EmployeesByAdminApiResDto> {
    const ids = this.simplifyArray(employeeIds)
    if (ids.length === 0) {
      return {
        items: [],
        total: 0,
      }
    }
    const url = this.getUrl('/admin/employee/batch');
    const resp = await this.httpService.post<any, EmployeesByAdminApiResDto>(url, {
      data: {
        ids: ids,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getEmployeeByUserIdApi(companyId: number, userId: number) {
    const url = await this.getUrl('/admin/employee/byUserId');
    const resp = await this.httpService.post(url, {
      data: { 
        companyId,
        userId,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getEmployeeByEmployeeIdApi(companyId: number, employeeId: number) {
    const url = this.getUrl('/admin/getEmpByIdAndCompId');
    const resp = await this.httpService.post(url, {
      data: {
        companyId,
        employeeId,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getUserDataByUserId(userId: number) : Promise<UserDataDto> {
    const url = this.getUrl('/admin/user/byUserId');
    const resp =  await this.httpService.post<any, UserDataDto>(url, {
      data: {
        userId,
        platformId: UcPlatform.SocialFlow,
      }
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getEmpByCompIdAndUserId(userIds: number[], companyIds: number[]):Promise<EmployeesInfoDto[]> {
    userIds = this.simplifyArray(userIds)
    companyIds = this.simplifyArray(companyIds)
    if (!userIds.length || !companyIds.length) {
      return []
    }
    const url = this.getUrl('/admin/employee/byCompIdAndUserId');
    const resp = await this.httpService.post<any, EmployeesInfoDto[]>(url, {
      data: {
        ids: userIds, 
        companyIds
      } 
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  async getCompaniesByAdminApi(tenantIds?: number[], page?: number, size?: number): Promise<any> {
    const data = {
      platformId: UcPlatform.SocialFlow,
      page: page || 1,
      size: size || 200,
      deleted: false,
    };
    tenantIds = this.simplifyArray(tenantIds)
    if (tenantIds.length) {
      data['ids'] = tenantIds
    }
    const url = this.getUrl('/admin/company/list');
    const resp = await this.httpService.post(url , { 
      data 
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
    });
    return resp.data;
  }

  /**
   * 获取租户下成员列表
   */
  async getEmployeeListByToken(token: string,page?: number, size?: number): Promise<any> {
    const data = {
      page: page || 1,
      size: size || 50
    };

    const url = this.getUrl('/employee/list')
    const resp = await this.httpService.post(url, { 
      data 
    }, {
      timeout: 5000, // 设置超时时间为 5000 毫秒 (5 秒)
      headers: {
        Authorization: token,
      }
    });
    return resp.data;
  }

  private getUrl(path: string): string {
    return `${this.ucEndpoint}${path.startsWith('/') ? path : ('/' + path)}`
  }

  private simplifyArray(ids?: string[]|number[]): number[] {
    return _.union(ids?.map(Number)).filter(Boolean)
  }
}