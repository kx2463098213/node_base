import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MQModule } from '@/shared/mq/mq.module';
import { RemoteModule } from '@/shared/remote/remote.module';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { LANGUAGE_TYPE } from '@/common/common.dto';
import path from 'path';
import { I18NModule } from '@/shared/i18n/i18n.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MQModule,
    I18NModule,
    RemoteModule,
    I18nModule.forRoot({
      fallbackLanguage: LANGUAGE_TYPE.Zh_CN,
      loaderOptions: {
        path: path.join(__dirname, '../common/i18n'),
        watch: true,
      },
      resolvers: [
        AcceptLanguageResolver,
      ],
    }),
  ],
  providers: [],
  exports: [
    ConfigModule,
    DatabaseModule,
    MQModule,
    RemoteModule,
    I18NModule,
  ],
})
export class CoreModule {}
