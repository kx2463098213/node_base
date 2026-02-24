import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { addTransactionalDataSource } from "typeorm-transactional";
import { Logger } from "@/common/logger/logger";
import { FactoryProvider } from "@nestjs/common";
import { BaseException } from "@/common/exceptions/custom.exception";

export const MYSQL_CONNECTION = Symbol('MYSQL_CONNECTION');
const logger = new Logger("mysqlProvider");

export const MysqlProvider: FactoryProvider<DataSource> = {
  inject: [ConfigService],
  provide: MYSQL_CONNECTION,
  useFactory: async (config: ConfigService): Promise<DataSource> => {
    try {
      const mysqlUrl = config.get("mysqlUrl", '');
      const connectConf: MysqlConnectionOptions = {
        url: mysqlUrl,
        type: "mysql",
        entities: [__dirname + "/../../../modules/**/entities/**/*orm-entity.{ts,js}"],
        synchronize: false,
        connectorPackage: "mysql2",
        namingStrategy: new SnakeNamingStrategy(), // 自动将实体表字段名驼峰转下划线
      };
      logger.debug("连接mysql: %j", mysqlUrl);
      const dataSource = new DataSource(connectConf);
      await dataSource.initialize();
      if (dataSource.isInitialized) {
        // 为事务添加数据源
        addTransactionalDataSource(dataSource);
        logger.info("mysql connect success");
      } else {
        logger.error("MYSQL Connect Error");
      }
      return dataSource;
    } catch (e) {
      logger.error("MYSQL Connect Error: %s", e.message);
      throw new BaseException(500, 'Mysql DataSource 初始化失败');
    }
  },
};