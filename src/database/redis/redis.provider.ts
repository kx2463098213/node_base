import { ConfigService } from "@nestjs/config";
import { Cluster, Redis } from "ioredis";
import { FactoryProvider } from "@nestjs/common";
import _ from "lodash";
import { BaseException } from "@/exception/custom.exception";
import { Logger } from "@/logger/logger";

export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');
const logger = new Logger("redisProvider");

export const RedisProvider: FactoryProvider<Cluster | Redis> = {
  inject: [ConfigService],
  provide: REDIS_CONNECTION,
  useFactory: (config: ConfigService): Cluster | Redis => {
    try {
      const redisConf = config.get("redis");
      logger.debug("连接redis: %j", redisConf);
      if (_.isArray(redisConf)) {
        const cluster = new Redis.Cluster(redisConf, {
          enableReadyCheck: true,
          enableOfflineQueue: false,
        });
        cluster.on("error", (e) => {
          logger.error("redis cluster on error. e: %j", e);
        });
        cluster.on("connect", () => {
          logger.info("redis cluster connect success.");
        });
        return cluster;
      }
      const redis = new Redis(redisConf.url, {
        password: redisConf.password || null,
        db: redisConf.db,
      });
      redis.on("error", (e) => {
        logger.error("redis on error. e: %j", e);
      });
      redis.on("connect", () => {
        logger.info("redis connect success.");
      });
      return redis;
    } catch (e) {
      logger.error("Redis Connect Error: %s", e?.message);
      throw new BaseException(500, 'Redis 连接失败');
    }
  },
};
