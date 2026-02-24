import { Global, Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { ConfigModule } from '@nestjs/config'
import { StorageController } from './storage.controller'
import { StorageService } from './storage.service'

@Global()
@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // 临时存储文件的目录
    }),
    ConfigModule,
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
