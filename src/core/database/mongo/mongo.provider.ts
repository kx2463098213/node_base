import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { FactoryProvider } from "@nestjs/common";
import { BaseException } from "@/common/exceptions/custom.exception";
import { Logger } from "@/common/logger/logger";
import { Db, MongoClient } from "mongodb";

export const MONGO_CONNECTION = Symbol('MONGO_CONNECTION');
const logger = new Logger("mongoProvider");

export const MongoProvider: FactoryProvider<DataSource> = {
  inject: [ConfigService],
  provide: MONGO_CONNECTION,
  useFactory: async (config: ConfigService): Promise<DataSource> => {
    try {
      const mongoUrl = config.get("mongodbUrl", '');
      const connectConf: MongoConnectionOptions = {
        url: mongoUrl,
        authSource: "admin",
        type: "mongodb",
        entities: [__dirname + "/../../../modules/**/*.entity{.ts,.js}"],
        synchronize: false,
      };
      logger.debug("连接mongo: %s", mongoUrl);
      const dataSource = new DataSource(connectConf);
      await dataSource.initialize();
      if (dataSource.isInitialized) {
        logger.info("mongo connect success");
      } else {
        logger.error("mongo connect error");
      }
      return dataSource;
    } catch (e) {
      logger.error("mongo Connect Error. msg: %s", e.message);
      throw new BaseException(500, 'Mongo DataSource 初始化失败');
    }
  },
};

export const MONGO_NATIVE_DB = Symbol("MONGO_NATIVE_DB");
export const MongoNativeProvider: FactoryProvider<Db> = {
  provide: MONGO_NATIVE_DB,
  inject: [ConfigService],
  useFactory: async (config: ConfigService): Promise<Db> => {
    try {
      const url = config.get("mongodbUrl", '');
      // 创建原生客户端
      const client = new MongoClient(url, {
        // 连接池配置
        minPoolSize: 5,
        maxPoolSize: 100,
      });

      // 连接
      await client.connect();
      const db =  client.db();
      logger.info('Native Mongo connect success')
      return db;
    } catch (e) {
      logger.error("Native MongoDB connect failure:", e.message);
      throw new BaseException(500, 'Native MongoDB connect failure');
    }
  },
};