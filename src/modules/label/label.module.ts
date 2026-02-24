import { Module } from "@nestjs/common";
import { LabelController } from "./label.controller";
import { LabelService } from "./label.service";
import { LabelRepository } from "./repositories/label.repository";

@Module({
  providers: [
    LabelService,
    LabelRepository,
  ],
  exports: [
    LabelService,
    LabelRepository,
  ],
  controllers: [
    LabelController
  ],
})
export class LabelModule {}