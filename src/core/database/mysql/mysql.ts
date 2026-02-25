import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { DataSource } from "typeorm";
import { MYSQL_CONNECTION } from "./mysql.provider";
import { Logger } from "@/common/logger/logger";

@Injectable()
export class MysqlService implements OnApplicationShutdown {
  private readonly logger = new Logger(MysqlService.name);

  constructor(@Inject(MYSQL_CONNECTION) readonly connection: DataSource) {}

  getDataSource(): DataSource {
    return this.connection;
  }

  onApplicationShutdown() {
    this.logger.info("MySQL Connection Closing...");
    if (this.connection?.destroy) {
      this.connection.destroy();
    }
  }
}