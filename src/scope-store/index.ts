import { AsyncLocalStorage } from 'async_hooks'
import _ from 'lodash'
import {  EMP_TYPE } from '@/modules/remote/uc/user.dto'
import { CurrentUser, CustomRequest } from '@/modules/remote/uc/auth.guard'

export type StoreData = {
  request: CustomRequest
  requestId?: string
}

export const scopeStore = new AsyncLocalStorage<StoreData>()

export const scopeUtils = new (class ScopeUtils {
  get store() {
    return scopeStore.getStore()
  }
  getUserId() {
    const user = this.getUser()
    return _.get(user, 'userId', null)
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
  getTenantId() {
    const user = this.getUser()
    return _.get(user, 'companyId', null)
  }
  getTimezone() {
    const user = this.getUser()
    return _.get(user, 'timeZone', "Asia/Shanghai")
  }

  getEmployeeType(){
    const user = this.getUser()
    return _.get(user, 'employeeType', null)
  }

  getEmployeeId(){
    const user = this.getUser()
    return _.get(user, 'employeeId', null)
  }
  getName(){
    const user = this.getUser()
    return _.get(user, 'name', null)
  }
  /**
   * 是否团队管理员/是否是团队 boss
   */
  getIsBoss() {
    const employeeType = this.getEmployeeType()
    if(employeeType === EMP_TYPE.BOSS){
      return true
    }
    return false
  }
})()
