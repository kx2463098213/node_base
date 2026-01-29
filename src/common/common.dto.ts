import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export enum OrderType {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum LANGUAGE_TYPE {
  Zh_CN = "zh-CN", // 简体中文
  En_US = "en-US", // English
}

export class BaseListDto {
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @IsNumber()
  size: number = 20;

  @IsOptional()
  @IsNumber()
  beginTime?: number; // unix 时间戳

  @IsOptional()
  @IsNumber()
  endTime?: number; // unix 时间戳

  @IsOptional()
  @IsString()
  word?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(OrderType)
  order?: OrderType;
}
