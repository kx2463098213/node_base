import { BeforeApplicationShutdown, Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@/logger/logger";
import { REDIS_CONNECTION } from "./redis.provider";
import { getErrMsg, SleepMS } from "@/utils/util";
import _ from "lodash";
import { BaseException } from "@/exception/custom.exception";

@Injectable()
export class RedisService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly keyPrefix: string;
  private readonly sleepTs = 100;

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CONNECTION) readonly client: Redis,
  ) {
    this.keyPrefix = this.config.get("redisPrefix", "");
  }

  formatKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  formatLockKey(key: string): string {
    return `${this.keyPrefix}:lock:${key}`
  }

  /**
   * 设置并给过期时间
   * @param {string} key 建
   * @param {any} value 值
   * @param {number} time 单位秒
   */
  async setAndExpire(key: string, value: string|number|Buffer, time: number): Promise<string|number> {
    return this.client.set(this.formatKey(key), value, 'EX', time);
  }

  async delKeysByPrefix(key: string): Promise<number> {
    const finalKey = this.formatKey(key);
    try {
      const keys = await this.client.keys(`${finalKey}*`);
      if (keys.length) {
        return this.client.del(keys);
      }
    } catch(e) {
      this.logger.info('delKeysByPrefix fail, key: %s, msg: %s', key, getErrMsg(e));
    }
    return 0;
  }

  /**
   * 设置
   * @param {string} key 建
   * @param {any} value 值
   */
  async set(key: string, value: string): Promise<string|number> {
    return this.client.set(this.formatKey(key), value);
  }

  async setByJson(key:string, json: Record<string, any>) {
    const value = JSON.stringify(json, null, 2);
    return this.set(key, value);
  }

  async setByJsonAndExpire(key: string, json: Record<string, any>, time: number) {
    const value = JSON.stringify(json, null, 2);
    return this.setAndExpire(key, value, time);
  }

  async setByNXAndExpire(key: string, value: string, time: number) {
    return this.client.set(this.formatKey(key), value, 'EX', time, 'NX');
  }

  async #get(key:string, isJson: boolean = false): Promise<any> {
    const value = await this.client.get(this.formatKey(key));
    if (_.isNil(value)) {
      return null;
    }

    try {
      return isJson ? JSON.parse(value) : value;
    } catch (error) {
      this.logger.warn(`#get error, msg: ${getErrMsg(error)}, value: ${value}`);
      throw error;
    }
  }

  async get(key: string): Promise<string|null> {
    return this.#get(key, false);
  }

  async get2Json(key: string):Promise<Record<string,any>|null> {
    return this.#get(key, true);
  }

  async remove(key: string) {
    return this.client.del(this.formatKey(key));
  }

  async publish(channel: string, message: string) {
    return this.client.publish(channel, message);
  }
  
  async hIncrBy(key: string, field: string, value?: number) {
    return this.client.hincrby(key, field, value || 1);
  }

  async hGetAll(key: string) {
    return this.client.hgetall(key);
  }

  async batchHGetAll(keys: string[]): Promise<any> {
    const result = {};
    if (keys?.length) {
      for (const key of keys) {
        const r = await this.hGetAll(key);
        result[key] = r;
      }
    }
    return result;
  }

  async hDel(key: string, field: string) {
    return this.client.hdel(key, field);
  }

  async hSet(key: string, field: string, value: number) {
    this.logger.debug('hSet key: %s, field: %s, v: %d', key, field, value);
    return this.client.hset(key, field, value);
  }

  async hExists(key: string, field: string): Promise<boolean> {
    if (!key || !field) {
      return false;
    }
    try {
      const exists = await this.client.hexists(key, field);
      return exists === 1;
    } catch (e) {
      this.logger.error('hexists error, key: %s, field: %s, msg: %s', key, field, getErrMsg(e));
      return false;
    }
  }

  async hasKey(key: string): Promise<boolean> {
    return !!this.client.exists(key);
  }

  async keyNotExists(keys: string[]): Promise<string[]> {
    if (!keys?.length) {
      return [];
    }

    try {
      const result: string[] = [];
      for (const key of keys) {
        if (!await this.client.exists(key)) {
          result.push(key);
        }
      }
      return result;
    } catch(e) {
      this.logger.error('keyExists error, msg: %s', getErrMsg(e));
      return [];
    }
  }

  async GetLock(k: string, ttl: number, timeout?: number) {
    const key = this.formatLockKey(k);
    let count = 0;
    const v = Date.now();
    let countLimit = 0;
    if (timeout) {
      countLimit = Math.round((timeout * 1000) / this.sleepTs);
    }

    const flag = true;
    while (flag) {
      const ret = await this.client.set(key, v, 'EX', Math.round(ttl), 'NX');
      if (ret === 'OK') {
        break;
      }
      await SleepMS(this.sleepTs);
      count++;
      if (countLimit && countLimit === count) {
        throw new BaseException(500, `GetLockTimeout: ${key}`)
      }
    }
    return v;
  }

  async RelLock(k: string, oldV: number) {
    const key =  this.formatLockKey(k);
    const nowV = await this.client.get(key);
    // 只有版本一样时才去删除。因可能已经丢失锁的权限
    if (+(nowV || 0) === oldV) {
      return await this.client.del(key);
    } else {
      this.logger.warn(`RedisLockDiffValue; key:${key}, nowV: ${nowV}, oldV: ${oldV}`);
    }
    return 0;
  }

  // 过期时间单位秒
  async addToSet(key: string, value: string, time: number) {
    const result = await this.client.sadd(this.formatKey(key), value);
    if (time) {
      await this.client.expire(this.formatKey(key), time);
    }
    return result;
  }

  async getSet(key: string) {
    return this.client.smembers(this.formatKey(key));
  }

  async valueExistsInSet(key: string, value: string) {
    return this.client.sismember(this.formatKey(key), value);
  }

  async removeFromSet(key: string, value: string) {
    return this.client.srem(this.formatKey(key), value);
  }

  // 随机时间，防止 redis 中同一批数据同时过期，从而导致的瞬间数据库/网络请求压力过大
  getRedisExpireTime(base: number, maxRandom: number = 10) {
    base = +base;
    maxRandom = +maxRandom;
    if (!base || base < 0) {
      throw new BaseException(500, `getRandomSec error(base), ${base} it's not a positive value`);
    }
    if (maxRandom < 0) {
      throw new BaseException(500, `getRandomSec error(maxRandom), ${maxRandom} it's not positive value`);
    }
    if (maxRandom) {
      return base + Math.floor(Math.random() * maxRandom);
    }
    return base;
  }

  async beforeApplicationShutdown() {
    this.client?.disconnect();
  }
}
