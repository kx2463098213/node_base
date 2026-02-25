import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { DataSource } from "typeorm";
import { MONGO_CONNECTION } from "./mongo.provider";
import { Logger } from "@/common/logger/logger";

@Injectable()
export class MongoService implements OnApplicationShutdown {
  private readonly logger = new Logger(MongoService.name);

  constructor(@Inject(MONGO_CONNECTION) readonly connection: DataSource) {}

  getDataSource(): DataSource {
    return this.connection;
  }

  onApplicationShutdown() {
    this.logger.info("MongoDB Connection Closing...");
    if (this.connection?.destroy) {
      this.connection.destroy();
    }
  }
}