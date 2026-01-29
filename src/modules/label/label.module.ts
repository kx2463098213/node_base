import { Module } from "@nestjs/common";
import { LabelController } from "./label.controller";
import { LabelService } from "./label.service";

@Module({
  providers: [
    LabelService,
  ],
  controllers: [
    LabelController
  ],
})
export class LabelModule {}