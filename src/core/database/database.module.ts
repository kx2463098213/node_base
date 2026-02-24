import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongoService } from "./mongo/mongo";
import { RedisService } from "./redis/redis";
import { MongoNativeProvider, MongoProvider } from "./mongo/mongo.provider";
import { RedisProvider } from "./redis/redis.provider";
import { MysqlProvider } from "./mysql/mysql.provider";
import { MysqlService } from "./mysql/mysql";
import { NativeMongoService } from "./mongo/native-mongo";

@Module({
  imports: [ConfigModule],
  providers: [
    MongoProvider,
    MongoNativeProvider,
    RedisProvider,
    MysqlProvider,
    MongoService,
    NativeMongoService,
    RedisService,
    MysqlService,
  ],
  exports: [
    MongoProvider,
    MongoNativeProvider,
    RedisProvider,
    MysqlProvider,
    MongoService,
    NativeMongoService,
    RedisService,
    MysqlService,
  ],
})
export class DatabaseModule {}
