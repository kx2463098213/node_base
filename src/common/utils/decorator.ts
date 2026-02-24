import { BaseException } from "@/common/exceptions/custom.exception";
import { Eval } from "./util";

type ExpKeyGetter = (...args: any[]) => string;

/**
 * 用于在方法执行前获取分布式锁的装饰器
 * 防止在分布式环境下，同一时间多个请求对同一个资源进行操作
 * 
 * @param module 模块名称，用于区分不同的模块
 * @param expKey 键的生成器函数或字符串模板，用于生成锁的键
 * @param ttl 锁的过期时间（秒），默认为300秒
 * @param limitTs 获取锁的超时时间（秒），默认为60秒
 */
export const Locked = (
  module: string,
  expKey: string | ExpKeyGetter,
  ttl: number = 300,
  limitTs: number = 60
) => {
  return (target: any, property: string) => {
    const value = target[property];
    async function decorateFun(...args: any[]) {
      let result;
      if (typeof value === "function") {
        const key =
          typeof expKey === "function"
            ? expKey(...args)
            : Eval({ args }, expKey);
        if (!key) {
          throw new BaseException(500, `lock key is empty. key: ${expKey}`);
        } else {
          const redisSdk = this.redisSdk;
          if (!redisSdk) {
            const msg = `${target.constructor.name}类需要注入「RedisSdk」, 设置为 redisSdk`;
            throw new BaseException(500, msg);
          }

          const lockKey = `${module}:${key}`;

          const lock = await redisSdk.GetLock(lockKey, ttl, limitTs);
          try {
            result = await value.apply(this, args);
          } finally {
            // 执行完成释放锁
            if (lock) {
              await redisSdk.RelLock(lockKey, lock);
            }
          }
        }
      }
      return result;
    }

    return {
      value: decorateFun,
      writable: true,
      enumerable: false,
      configurable: true,
    };
  };
};