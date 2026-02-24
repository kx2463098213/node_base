import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { BucketAccess } from './storage.enum'

export class BaseDTO {
  @IsOptional()
  @IsEnum(BucketAccess)
  access: string = 'private'; // public | private

  @IsOptional()
  contentType?: string; // eg. application/json | image/png | image|jpeg
}

export class DownloadUrlDTO extends BaseDTO {
  @IsOptional()
  key?: string;

  @IsOptional()
  keys?: string[];
}

export class StorageRequestDTO extends BaseDTO {
  // key: string
  @IsString()
  @IsNotEmpty()
  md5: string;

  @IsString()
  @IsNotEmpty()
  ext: string;

  @IsOptional()
  checkMd5?: boolean = true;
}