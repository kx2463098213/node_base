import { AxiosRequestConfig } from "axios"
import crypto from 'crypto';
import _ from "lodash";
import { Md5 } from "./util";

/**
 * HTTP 请求签名工具
 *
 * 用于服务间调用时对请求进行 HMAC-SHA256 签名，防止请求被篡改或伪造。
 * 签名字符串格式：`{path}-{METHOD}-{paramMd5}-{bodyMd5}-{appId}-{timestamp}-{nonce}`
 *
 * 使用方式：
 * 1. 在 axios 请求拦截器中调用 sign()，传入 appId、secret 及请求信息
 * 2. 请求头需提前设置 `timestamp`（Unix 秒）和 `nonce`（随机字符串）
 * 3. 签名结果写入请求头 `sign` 字段，由服务端验证
 *
 * 对端验证时需使用相同的 secret 重新计算签名并比对。
 */
const EMPTY_STRING_MD5 = 'd41d8cd98f00b204e9800998ecf8427e'; // 空字符串 Md5

export function sign (
  appId: string,
  secret: string,
  method: string,
  path: string,
  config: AxiosRequestConfig,
  body: Record<string, any>
) {
  if (!appId || !secret) {
    return
  }
  const headers = config.headers || {}
  const param = config.params
  const paramMd5 = getParamMd5(param)
  const bodyMd5 = getBodyMd5(body)
  const timestamp = headers['timestamp']
  const nonce = headers['nonce']
  const signStr = `${path}-${method.toUpperCase()}-${paramMd5}-${bodyMd5}-${appId}-${timestamp}-${nonce}`
  const signature = crypto.createHmac('sha256', secret).update(signStr).digest()
  const sign =  Buffer.from(signature).toString('base64')
  headers['sign'] = sign
}

function getParamMd5(param: Record<string, any>) {
  if (_.isEmpty(param)) {
    return EMPTY_STRING_MD5
  }
  return Md5(sortObjectByKey(param))
}

function sortObjectByKey(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort()
  return sortedKeys.map(it => `${it}=${obj[it]}`).join('&')
}

function getBodyMd5(body: Record<string, any>) {
  if (!body) {
    return EMPTY_STRING_MD5
  }
  const bodyStr = JSON.stringify(body);
  const md5 = Md5(bodyStr);
  return md5
}