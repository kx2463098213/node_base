import { Module } from "@nestjs/common";
import { DeployController } from "./deploy.controller";
import { DatabaseModule } from "@/core/database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [DeployController],
})
export class DeployModule {}
