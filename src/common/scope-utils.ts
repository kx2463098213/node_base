import { AsyncLocalStorage } from 'async_hooks'
import _ from 'lodash'
import {  EMP_TYPE } from '@/shared/remote/uc/user.dto'
import { CurrentUser, CustomRequest } from '@/core/guards/auth.guard'

export type StoreData = {
  request: CustomRequest
  requestId?: string
}

export const scopeStore = new AsyncLocalStorage<StoreData>()

export const scopeUtils = new (class ScopeUtils {
  get store() {
    return scopeStore.getStore()
  }

  getUserId(): number {
    const user = this.getUser()
    return _.get(user, 'userId', 0)
  }

  getRequest() {
    return _.get(this.store, 'request')
  }

  getUser(): CurrentUser|null {
    const request = this.getRequest()
    return _.get(request, 'user', null)
  }

  getRequestId() {
    return _.get(this.store, 'requestId', 'system')
  }

  getTenantId(): number {
    const user = this.getUser()
    return _.get(user, 'companyId', 0)
  }

  getTimezone() {
    const user = this.getUser()
    return _.get(user, 'timeZone', "Asia/Shanghai")
  }

  getEmployeeType(): number {
    const user = this.getUser()
    return _.get(user, 'employeeType', 0)
  }

  getEmployeeId(): number {
    const user = this.getUser()
    return _.get(user, 'employeeId', 0)
  }
  getName(): string {
    const user = this.getUser()
    return _.get(user, 'name', '')
  }
  /**
   * 是否团队管理员/是否是团队 boss
   */
  getIsBoss(): boolean {
    const employeeType = this.getEmployeeType()
    if(employeeType === EMP_TYPE.BOSS){
      return true
    }
    return false
  }
})();