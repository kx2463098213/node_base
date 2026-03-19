import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    ConfigModule,
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}