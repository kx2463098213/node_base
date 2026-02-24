import { Module } from "@nestjs/common";
import { MyI18nService } from "./my.i18n.service";

@Module({
  imports: [],
  providers: [
    MyI18nService,
  ],
  exports: [
    MyI18nService,
  ],
})
export class I18NModule {}