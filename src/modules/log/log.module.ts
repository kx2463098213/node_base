import { Module } from "@nestjs/common";
import { LogController } from "./log.controller";
import { LogService } from "./log.service";
import { LogRepository } from "./repositories/log.repository";

@Module({
  providers: [
    LogService,
    LogRepository,
  ],
  controllers: [
    LogController
  ],
  exports: [
    LogService,
    LogRepository,
  ],
})
export class LogModule {}
