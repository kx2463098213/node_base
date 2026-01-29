import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MQModule } from './mq/mq.module';
import { RemoteModule } from './modules/remote/remote.module';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { LANGUAGE_TYPE } from './common/common.dto';
import path from 'path';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MQModule,
    RemoteModule,
      I18nModule.forRoot({
      // 设置默认语言为英语
      fallbackLanguage: LANGUAGE_TYPE.Zh_CN,
      // 配置语言文件加载选项
      loaderOptions: {
        // 设置语言文件的路径
        path: path.join(__dirname, '/i18n/'),
        // 启用文件监视，自动重载语言文件
        watch: true,
      },
      // 配置语言解析器
      resolvers: [
        // 解析请求头中的 Accept-Language 设置
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
  ],
})

export class GlobalModule {}
